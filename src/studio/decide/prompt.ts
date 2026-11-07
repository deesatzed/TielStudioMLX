import { PRESETS, type Preset } from "../types";

/** Small instruct model. q4f16 weights are about 0.5 GB, versus ~30 GB for Cyber-Tiel. */
export const LOCAL_MODEL_ID = "onnx-community/Qwen2.5-0.5B-Instruct";
export const LOCAL_MODEL_LABEL = "Qwen2.5-0.5B";

export type Purpose = "route" | "risk" | "choose" | "yesno" | "custom";

export const PURPOSES: { id: Purpose; label: string }[] = [
  { id: "route", label: "Route" },
  { id: "risk", label: "Risk" },
  { id: "choose", label: "Choose" },
  { id: "yesno", label: "Yes or no" },
  { id: "custom", label: "Custom" },
];

export type Decision = {
  text: string;
  preset: Preset;
  confidence: number;
  reasons: string[];
  hold: boolean;
  holdWhy: string;
  maxTokens: number;
  temperature: number;
  model: string;
  ms: number;
  failed: boolean;
};

export const DECISION_SYSTEM = [
  "You are the decision model for Cyber-Tiel Studio.",
  "You do not answer the user's task and you do not write code.",
  "You only choose how the coding model should be run.",
  "Reply with one JSON object and no markdown.",
].join(" ");

export function decisionPrompt(text: string, hasImage: boolean): string {
  return [
    'Schema: {"preset":"coding"|"review"|"vision","confidence":0 to 1,"reasons":["up to 3 short phrases"],"hold":false,"holdWhy":"","temperature":0 to 1,"maxTokens":256 to 2048}',
    "Use vision when an image is attached or the draft asks about a screenshot or interface.",
    "Use review when the draft asks for a critique, bug, race, security check, or patch review.",
    "Use coding otherwise.",
    "Set hold true only for a credential, private key, or a destructive command such as rm -rf, drop table, mkfs, or chmod -R 777. Otherwise hold is false and holdWhy is empty.",
    "Cooler temperature for review and vision. Higher maxTokens for a long or multi-step draft.",
    `Image attached: ${hasImage ? "yes" : "no"}`,
    "Draft:",
    redact(text).slice(0, 4000),
  ].join("\n");
}

export function hardHold(text: string): string {
  const secret = secretLike(text);
  const command = destructive(text);
  if (secret && command) return "This draft looks like a secret and a destructive command.";
  if (secret) return "This draft looks like a secret or credential.";
  if (command) return "This draft looks like a destructive command.";
  return "";
}

export function parseDecision(raw: string): Omit<
  Decision,
  "text" | "model" | "ms" | "failed"
> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("The decision model did not return JSON.");
  }
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("The decision model did not return JSON.");
  }
  const preset = json.preset;
  if (preset !== "coding" && preset !== "review" && preset !== "vision") {
    throw new Error("The decision model returned an unknown route.");
  }
  const base = PRESETS[preset].sampling;
  const reasons = Array.isArray(json.reasons)
    ? json.reasons
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const hold = json.hold === true;
  const holdWhy = typeof json.holdWhy === "string" ? json.holdWhy.trim().slice(0, 180) : "";
  return {
    preset,
    confidence: clamp(numberish(json.confidence, 0.5), 0, 1),
    reasons,
    hold,
    holdWhy: hold ? holdWhy || "The decision model held this draft." : "",
    temperature: clamp(numberish(json.temperature, base.temperature), 0, 1),
    maxTokens: clamp(Math.round(numberish(json.maxTokens, base.maxTokens)), 256, 2048),
  };
}

export function applyHardHold<T extends { hold: boolean; holdWhy: string }>(
  text: string,
  decision: T,
): T {
  const why = hardHold(text);
  if (!why) return decision;
  return { ...decision, hold: true, holdWhy: why };
}

function redact(text: string): string {
  return text
    .replace(/sk-[A-Za-z0-9]{8,}/g, "sk-[redacted]")
    .replace(/AKIA[0-9A-Z]{16}/g, "AKIA[redacted]")
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[private key redacted]")
    .replace(/\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*\S{6,}/gi, "$1=[redacted]")
    .replace(/\bbearer\s+[A-Za-z0-9._-]{12,}/gi, "bearer [redacted]");
}

function secretLike(text: string): boolean {
  return (
    /sk-[A-Za-z0-9]{8,}/.test(text) ||
    /AKIA[0-9A-Z]{16}/.test(text) ||
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text) ||
    /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*\S{6,}/i.test(text) ||
    /\bbearer\s+[A-Za-z0-9._-]{12,}/i.test(text)
  );
}

function destructive(text: string): boolean {
  return (
    /\brm\s+-rf\b/i.test(text) ||
    /\bdrop\s+table\b/i.test(text) ||
    /\btruncate\s+table\b/i.test(text) ||
    /\bmkfs(\.\w+)?\b/i.test(text) ||
    /\bformat\s+[a-z]:/i.test(text) ||
    /\bchmod\s+-R\s+777\b/i.test(text)
  );
}

function numberish(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function purposeRequest(
  purpose: Purpose,
  text: string,
  hasImage: boolean,
  question: string,
): { system: string; user: string; maxNewTokens: number } {
  if (purpose === "route") {
    return { system: DECISION_SYSTEM, user: decisionPrompt(text, hasImage), maxNewTokens: 160 };
  }
  const draft = [`Image attached: ${hasImage ? "yes" : "no"}`, "Draft:", redact(text).slice(0, 4000)].join(
    "\n",
  );
  if (purpose === "risk") {
    return {
      system:
        "You judge risk for a coding studio. Reply with one JSON object only: {\"hold\":false,\"holdWhy\":\"\",\"note\":\"\"}. hold is true only for a credential, private key, or a destructive command. Do not answer the task.",
      user: draft,
      maxNewTokens: 120,
    };
  }
  if (purpose === "choose") {
    return {
      system:
        "Pick exactly one option that the draft names. Reply with the choice and one short reason. If the draft lists no options, say what is missing. Do not write the implementation.",
      user: draft,
      maxNewTokens: 80,
    };
  }
  if (purpose === "yesno") {
    return {
      system: "Answer yes or no, then one short reason. Do not write code.",
      user: draft,
      maxNewTokens: 60,
    };
  }
  return {
    system:
      "You are a small local decision model. Decide the question in a few sentences. Do not write the implementation.",
    user: [`Question: ${question.trim() || "What should be decided?"}`, draft].join("\n\n"),
    maxNewTokens: 160,
  };
}
