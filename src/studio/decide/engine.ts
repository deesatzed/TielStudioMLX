import type { DeviceName, ModelSnap } from "./engine-types";

export type { DeviceName, ModelSnap } from "./engine-types";

let snap: ModelSnap = {
  phase: "idle",
  progress: 0,
  detail: "",
  device: null,
  error: "",
};
const listeners = new Set<(next: ModelSnap) => void>();
let worker: Worker | null = null;
let loading: Promise<void> | null = null;
let nextId = 1;
const jobs = new Map<number, { resolve: (value: { text: string; ms: number; device: DeviceName }) => void; reject: (error: Error) => void }>();

function publish(patch: Partial<ModelSnap>) {
  snap = { ...snap, ...patch };
  for (const listener of listeners) listener(snap);
}

export function getModelSnap(): ModelSnap {
  return snap;
}

export function subscribeModel(listener: (next: ModelSnap) => void): () => void {
  listeners.add(listener);
  listener(snap);
  return () => listeners.delete(listener);
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./decide.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent) => {
    const message = event.data as {
      type: string;
      progress?: number;
      detail?: string;
      device?: DeviceName;
      error?: string;
      id?: number;
      text?: string;
      ms?: number;
    };
    if (message.type === "progress") {
      publish({
        phase: "loading",
        progress: message.progress ?? snap.progress,
        detail: message.detail ?? "",
      });
      return;
    }
    if (message.type === "ready" && message.device) {
      publish({
        phase: "ready",
        progress: 100,
        device: message.device,
        detail: message.device === "webgpu" ? "WebGPU" : "WASM",
        error: "",
      });
      return;
    }
    if (message.type === "error") {
      loading = null;
      publish({ phase: "error", error: message.error || "The decision model failed to load." });
      return;
    }
    if (message.id == null) return;
    const job = jobs.get(message.id);
    if (!job) return;
    jobs.delete(message.id);
    if (message.type === "result" && message.device) {
      job.resolve({ text: message.text ?? "", ms: message.ms ?? 0, device: message.device });
    } else {
      job.reject(new Error(message.error || "The decision model failed."));
    }
  };
  return worker;
}

export function loadDecisionModel(): Promise<void> {
  if (snap.phase === "ready") return Promise.resolve();
  if (loading) return loading;
  publish({ phase: "loading", progress: 0, detail: "Opening the runtime", error: "" });
  loading = new Promise<void>((resolve, reject) => {
    const stop = subscribeModel((next) => {
      if (next.phase === "ready") {
        stop();
        resolve();
      } else if (next.phase === "error") {
        stop();
        loading = null;
        reject(new Error(next.error || "The decision model failed to load."));
      }
    });
    ensureWorker().postMessage({ type: "load" });
  });
  return loading;
}

export function generateLocal(
  system: string,
  user: string,
  maxNewTokens: number,
): Promise<{ text: string; ms: number; device: DeviceName }> {
  return loadDecisionModel().then(
    () =>
      new Promise((resolve, reject) => {
        const id = nextId++;
        jobs.set(id, { resolve, reject });
        ensureWorker().postMessage({ type: "generate", id, system, user, maxNewTokens });
      }),
  );
}
