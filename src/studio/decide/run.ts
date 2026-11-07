import { useEffect, useState } from "react";
import { generateLocal, getModelSnap, loadDecisionModel, subscribeModel, type ModelSnap } from "./engine";
import {
  applyHardHold,
  hardHold,
  LOCAL_MODEL_LABEL,
  parseDecision,
  purposeRequest,
  type Decision,
  type Purpose,
} from "./prompt";

const memory = new Map<string, Decision>();

function deviceLabel(device: "webgpu" | "wasm"): string {
  return `${LOCAL_MODEL_LABEL} · ${device === "webgpu" ? "WebGPU" : "WASM"}`;
}

function unloaded(text: string): Decision {
  return applyHardHold(text, {
    text,
    preset: "coding",
    confidence: 0,
    reasons: [],
    hold: false,
    holdWhy: "",
    maxTokens: 1400,
    temperature: 0.6,
    model: LOCAL_MODEL_LABEL,
    ms: 0,
    failed: true,
  });
}

export async function decideRoute(text: string, hasImage: boolean): Promise<Decision> {
  const trimmed = text.trim();
  if (getModelSnap().phase !== "ready") return unloaded(trimmed);
  const key = `route|${hasImage ? 1 : 0}|${trimmed}`;
  const cached = memory.get(key);
  if (cached) return cached;
  const request = purposeRequest("route", trimmed, hasImage, "");
  try {
    const raw = await generateLocal(request.system, request.user, request.maxNewTokens);
    const decision = applyHardHold(trimmed, {
      ...parseDecision(raw.text),
      text: trimmed,
      model: deviceLabel(raw.device),
      ms: raw.ms,
      failed: false,
    });
    memory.set(key, decision);
    return decision;
  } catch {
    return unloaded(trimmed);
  }
}

export function useModelSnap(): ModelSnap {
  const [snap, setSnap] = useState(getModelSnap);
  useEffect(() => subscribeModel(setSnap), []);
  return snap;
}

export function useLocalDecision(
  text: string,
  hasImage: boolean,
  purpose: Purpose,
  question: string,
): { decision: Decision | null; note: string; pending: boolean } {
  const snap = useModelSnap();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const trimmed = text.trim();
    let cancel = false;
    setDecision(null);
    setNote("");
    const ready = snap.phase === "ready";
    if (!ready || (trimmed.length < 2 && !hasImage) || (purpose === "custom" && question.trim().length < 2)) {
      setPending(false);
      return;
    }
    setPending(true);
    const handle = window.setTimeout(() => {
      const request = purposeRequest(purpose, trimmed, hasImage, question);
      void generateLocal(request.system, request.user, request.maxNewTokens)
        .then((raw) => {
          if (cancel) return;
          if (purpose === "route") {
            try {
              const next = applyHardHold(trimmed, {
                ...parseDecision(raw.text),
                text: trimmed,
                model: deviceLabel(raw.device),
                ms: raw.ms,
                failed: false,
              });
              memory.set(`route|${hasImage ? 1 : 0}|${trimmed}`, next);
              setDecision(next);
              setNote("");
            } catch {
              setDecision(unloaded(trimmed));
              setNote(raw.text);
            }
            return;
          }
          setDecision(null);
          setNote(raw.text || "No decision.");
        })
        .catch(() => {
          if (cancel) return;
          setDecision(null);
          setNote("");
        })
        .finally(() => {
          if (!cancel) setPending(false);
        });
    }, 400);
    return () => {
      cancel = true;
      window.clearTimeout(handle);
    };
  }, [text, hasImage, purpose, question, snap.phase]);

  return { decision, note, pending };
}

export { loadDecisionModel };
