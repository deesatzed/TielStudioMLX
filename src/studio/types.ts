export type Role = "user" | "assistant";

export type Preset = "coding" | "review" | "vision";

export type RuntimeMode = "preview" | "local";

export type Attachment = {
  name: string;
  dataUrl?: string;
  width?: number;
  height?: number;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  createdAt: number;
  error?: string;
  ms?: number;
};

export type Session = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

export type Sampling = {
  preset: Preset;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
};

export type RuntimeSettings = {
  mode: RuntimeMode;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export const PRESETS: Record<
  Preset,
  { label: string; hint: string; sampling: Omit<Sampling, "preset"> }
> = {
  coding: {
    label: "Coding",
    hint: "Direct implementation. Temp 0.6, top-p 0.95, top-k 20.",
    sampling: { temperature: 0.6, topP: 0.95, topK: 20, maxTokens: 1400 },
  },
  review: {
    label: "Review",
    hint: "Races, bounds, and insecure defaults. Slightly wider top-k.",
    sampling: { temperature: 0.4, topP: 0.9, topK: 40, maxTokens: 1400 },
  },
  vision: {
    label: "Vision",
    hint: "Screenshot first, then the engineering point.",
    sampling: { temperature: 0.3, topP: 0.9, topK: 20, maxTokens: 900 },
  },
};

export const DEFAULT_MODEL =
  "peculiar-ragdoll/Cyber-Tiel-Coder-35B-A3B-MLX-oQ6e-MTP";
