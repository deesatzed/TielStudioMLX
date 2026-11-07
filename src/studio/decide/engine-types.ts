export type DeviceName = "webgpu" | "wasm";

export type ModelSnap = {
  phase: "idle" | "loading" | "ready" | "error";
  progress: number;
  detail: string;
  device: DeviceName | null;
  error: string;
};
