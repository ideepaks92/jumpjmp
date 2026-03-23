import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Dataset, ColumnSchemaItem } from "@/lib/schemas/dataset";
import type { Analysis, AnalysisConfig } from "@/lib/schemas/analysis";

export interface Workspace {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkspaceState {
  workspace: Workspace | null;
  datasets: Dataset[];
  analyses: Analysis[];
  activeDatasetId: string | null;
  activeAnalysisId: string | null;
  isLoading: boolean;
  error: string | null;

  setWorkspace: (workspace: Workspace) => void;
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (id: string) => void;
  setActiveDataset: (id: string | null) => void;
  setAnalyses: (analyses: Analysis[]) => void;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (id: string, updates: Partial<Analysis>) => void;
  removeAnalysis: (id: string) => void;
  setActiveAnalysis: (id: string | null) => void;
  updateColumnType: (
    datasetId: string,
    columnName: string,
    newType: ColumnSchemaItem["type"]
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  workspace: null,
  datasets: [],
  analyses: [],
  activeDatasetId: null,
  activeAnalysisId: null,
  isLoading: false,
  error: null,
};

export const useWorkspaceStore = create<WorkspaceState>()(
  immer((set) => ({
    ...initialState,

    setWorkspace: (workspace) =>
      set((state) => {
        state.workspace = workspace;
      }),

    setDatasets: (datasets) =>
      set((state) => {
        state.datasets = datasets;
      }),

    addDataset: (dataset) =>
      set((state) => {
        state.datasets.push(dataset);
        if (!state.activeDatasetId) {
          state.activeDatasetId = dataset.id;
        }
      }),

    removeDataset: (id) =>
      set((state) => {
        state.datasets = state.datasets.filter((d) => d.id !== id);
        if (state.activeDatasetId === id) {
          state.activeDatasetId = state.datasets[0]?.id ?? null;
        }
        state.analyses = state.analyses.filter((a) => a.dataset_id !== id);
      }),

    setActiveDataset: (id) =>
      set((state) => {
        state.activeDatasetId = id;
      }),

    setAnalyses: (analyses) =>
      set((state) => {
        state.analyses = analyses;
      }),

    addAnalysis: (analysis) =>
      set((state) => {
        state.analyses.push(analysis);
        state.activeAnalysisId = analysis.id;
      }),

    updateAnalysis: (id, updates) =>
      set((state) => {
        const idx = state.analyses.findIndex((a) => a.id === id);
        if (idx !== -1) {
          Object.assign(state.analyses[idx], updates);
        }
      }),

    removeAnalysis: (id) =>
      set((state) => {
        state.analyses = state.analyses.filter((a) => a.id !== id);
        if (state.activeAnalysisId === id) {
          state.activeAnalysisId = null;
        }
      }),

    setActiveAnalysis: (id) =>
      set((state) => {
        state.activeAnalysisId = id;
      }),

    updateColumnType: (datasetId, columnName, newType) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds) {
          const col = ds.column_schema.find((c) => c.name === columnName);
          if (col) col.type = newType;
        }
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    reset: () => set(() => ({ ...initialState })),
  }))
);

// Selectors
export const selectActiveDataset = (state: WorkspaceState) =>
  state.datasets.find((d) => d.id === state.activeDatasetId) ?? null;

export const selectActiveAnalysis = (state: WorkspaceState) =>
  state.analyses.find((a) => a.id === state.activeAnalysisId) ?? null;

export const selectDatasetAnalyses =
  (datasetId: string) => (state: WorkspaceState) =>
    state.analyses.filter((a) => a.dataset_id === datasetId);
