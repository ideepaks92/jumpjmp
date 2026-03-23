/* eslint-disable @typescript-eslint/no-explicit-any */

let pyodide: any = null;

async function loadPyodideRuntime() {
  try {
    (globalThis as any).importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
    pyodide = await (globalThis as any).loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    await pyodide.loadPackage(["numpy", "scipy"]);
    postMessage({ type: "ready" });
  } catch (e) {
    postMessage({
      type: "load_error",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

async function runPython(code: string, globals: Record<string, unknown> = {}) {
  if (!pyodide) throw new Error("Pyodide not loaded");
  const ns = pyodide.globals.get("dict")();
  for (const [key, value] of Object.entries(globals)) {
    ns.set(key, pyodide.toPy(value));
  }
  const result = await pyodide.runPythonAsync(code, { globals: ns });
  return result?.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
}

addEventListener("message", async (e: MessageEvent) => {
  const msg = e.data;

  if (msg.type === "load") {
    await loadPyodideRuntime();
    return;
  }

  if (msg.type === "compute") {
    try {
      const { id, data, params } = msg;
      const analysisType = data.analysisType as string;

      let result: unknown;

      if (analysisType === "distribution_fit") {
        result = await runPython(
          `
import numpy as np
from scipy import stats

values = np.array(data, dtype=float)
values = values[~np.isnan(values)]

distributions = {
    'normal': stats.norm,
    'lognormal': stats.lognorm,
    'weibull': stats.weibull_min,
    'exponential': stats.expon,
}

results = {}
for name, dist in distributions.items():
    try:
        params = dist.fit(values)
        ks_stat, ks_p = stats.kstest(values, name if name != 'weibull' else 'weibull_min', args=params)
        results[name] = {
            'params': [float(p) for p in params],
            'ks_statistic': float(ks_stat),
            'ks_pvalue': float(ks_p),
            'aic': float(-2 * np.sum(dist.logpdf(values, *params)) + 2 * len(params)),
        }
    except Exception as e:
        results[name] = {'error': str(e)}

best = min(
    [(k, v) for k, v in results.items() if 'aic' in v],
    key=lambda x: x[1]['aic'],
    default=(None, None)
)

output = {'distributions': results, 'best_fit': best[0] if best[0] else None}
output
`,
          { data: data.values }
        );
      } else {
        result = await runPython(
          `
result = {"message": "Custom analysis not implemented", "params": dict(params)}
result
`,
          { data, params: params ?? {} }
        );
      }

      postMessage({ type: "result", id, success: true, result });
    } catch (err) {
      postMessage({
        type: "result",
        id: msg.id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
});
