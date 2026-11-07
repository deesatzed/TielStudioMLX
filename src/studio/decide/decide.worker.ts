import { LOCAL_MODEL_ID } from "./prompt";

type DeviceName = "webgpu" | "wasm";

type ProgressEvent = {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

type ChatMessage = { role: "system" | "user"; content: string };

type Generator = (
  messages: ChatMessage[],
  options: { max_new_tokens: number; do_sample: boolean; return_full_text: boolean },
) => Promise<unknown>;

type Inbound =
  | { type: "load" }
  | { type: "generate"; id: number; system: string; user: string; maxNewTokens: number };

let generator: Generator | null = null;
let device: DeviceName | null = null;
let chain: Promise<unknown> = Promise.resolve();
let loading: Promise<void> | null = null;

const post = (message: unknown) => self.postMessage(message);

async function webGpuAvailable(): Promise<boolean> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
  if (!gpu) return false;
  try {
    return Boolean(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

function report(event: ProgressEvent) {
  let progress = 0;
  if (typeof event.loaded === "number" && typeof event.total === "number" && event.total > 0) {
    progress = Math.round((event.loaded / event.total) * 100);
  } else if (typeof event.progress === "number") {
    progress = Math.round(event.progress);
  }
  const file = event.file?.split("/").pop() ?? "";
  const detail =
    file && (event.status === "progress" || event.status === "download")
      ? `${file} ${progress}%`
      : event.status === "done"
        ? file || "Cached"
        : event.status || "";
  post({ type: "progress", progress, detail });
}

async function load() {
  if (generator && device) {
    post({ type: "ready", device });
    return;
  }
  if (loading) return loading;
  loading = loadOnce().catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

async function loadOnce() {
  if (generator && device) {
    post({ type: "ready", device });
    return;
  }
  const mod = (await import("@huggingface/transformers")) as unknown as {
    pipeline: (
      task: "text-generation",
      model: string,
      options: { dtype: string; device: DeviceName; progress_callback: (event: ProgressEvent) => void },
    ) => Promise<Generator>;
    env: {
      allowLocalModels: boolean;
      useBrowserCache: boolean;
      backends?: { onnx?: { wasm?: { numThreads?: number } } };
    };
  };
  mod.env.allowLocalModels = false;
  mod.env.useBrowserCache = true;
  if (mod.env.backends?.onnx?.wasm) mod.env.backends.onnx.wasm.numThreads = 1;
  const devices: DeviceName[] = (await webGpuAvailable()) ? ["webgpu", "wasm"] : ["wasm"];
  let last: unknown = new Error("The decision model failed to load.");
  for (const dtype of ["q4f16", "q4"]) {
    for (const next of devices) {
      try {
        generator = await mod.pipeline("text-generation", LOCAL_MODEL_ID, {
          dtype,
          device: next,
          progress_callback: report,
        });
        device = next;
        post({ type: "ready", device });
        return;
      } catch (error) {
        last = error;
        generator = null;
      }
    }
  }
  throw last;
}

function readGenerated(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;
  if (!first || typeof first !== "object") return "";
  const generated = (first as { generated_text?: unknown }).generated_text;
  if (typeof generated === "string") return generated.trim();
  if (Array.isArray(generated)) {
    const last = generated[generated.length - 1];
    if (last && typeof last === "object" && "content" in last && typeof last.content === "string") {
      return last.content.trim();
    }
  }
  return "";
}

self.onmessage = (event: MessageEvent<Inbound>) => {
  const message = event.data;
  if (message.type === "load") {
    void load()
      .catch((error: unknown) => {
        post({
          type: "error",
          error: error instanceof Error ? error.message : "The decision model failed to load.",
        });
      });
    return;
  }
  const job = chain.then(async () => {
    if (!generator || !device) await load();
    if (!generator || !device) throw new Error("The decision model is not loaded.");
    const started = performance.now();
    const output = await generator(
      [
        { role: "system", content: message.system },
        { role: "user", content: message.user },
      ],
      { max_new_tokens: message.maxNewTokens, do_sample: false, return_full_text: false },
    );
    post({
      type: "result",
      id: message.id,
      text: readGenerated(output),
      ms: Math.round(performance.now() - started),
      device,
    });
  });
  chain = job.then(
    () => undefined,
    (error: unknown) => {
      post({
        type: "result-error",
        id: message.id,
        error: error instanceof Error ? error.message : "The decision model failed.",
      });
    },
  );
};
