export type ComputeRequest = {
  id: string;
  type: "distribution_fit" | "advanced_regression" | "custom";
  data: Record<string, unknown>;
  params: Record<string, unknown>;
};

export type ComputeResponse = {
  id: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
};

type PendingRequest = {
  resolve: (value: ComputeResponse) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let loadPromise: Promise<void> | null = null;
const pending = new Map<string, PendingRequest>();
let isLoaded = false;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL("./pyodide-worker.ts", import.meta.url),
      { type: "module" }
    );
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      if (msg.type === "ready") {
        isLoaded = true;
        return;
      }
      if (msg.type === "result") {
        const p = pending.get(msg.id);
        if (p) {
          pending.delete(msg.id);
          p.resolve(msg as ComputeResponse);
        }
      }
    };
    worker.onerror = (e) => {
      pending.forEach((p) => p.reject(new Error(e.message)));
      pending.clear();
    };
  }
  return worker;
}

export async function ensurePyodide(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (isLoaded) return;
  if (loadPromise) return loadPromise;

  onProgress?.("Loading analysis engine...");
  const w = getWorker();

  loadPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Pyodide load timed out after 30s"));
    }, 30000);

    const handler = (e: MessageEvent) => {
      if (e.data.type === "ready") {
        clearTimeout(timeout);
        isLoaded = true;
        w.removeEventListener("message", handler);
        resolve();
      }
      if (e.data.type === "load_error") {
        clearTimeout(timeout);
        w.removeEventListener("message", handler);
        reject(new Error(e.data.error));
      }
    };
    w.addEventListener("message", handler);
    w.postMessage({ type: "load" });
  });

  return loadPromise;
}

export async function runCompute(
  request: Omit<ComputeRequest, "id">
): Promise<ComputeResponse> {
  await ensurePyodide();
  const id = crypto.randomUUID();
  const w = getWorker();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error("Compute timed out after 60s"));
    }, 60000);

    pending.set(id, {
      resolve: (res) => {
        clearTimeout(timeout);
        resolve(res);
      },
      reject: (err) => {
        clearTimeout(timeout);
        reject(err);
      },
    });

    w.postMessage({ ...request, id, type: "compute" });
  });
}

export function isPyodideLoaded(): boolean {
  return isLoaded;
}

export function terminateWorker(): void {
  worker?.terminate();
  worker = null;
  loadPromise = null;
  isLoaded = false;
  pending.forEach((p) => p.reject(new Error("Worker terminated")));
  pending.clear();
}
