import { useEffect, useState } from "react";
import { useStudio } from "../store";
import { loadDecisionModel } from "./engine";
import { LOCAL_MODEL_LABEL, PURPOSES, type Decision, type Purpose } from "./prompt";
import { useLocalDecision, useModelSnap } from "./run";

export function DecisionBar({
  draft,
  hasImage,
  onRoute,
}: {
  draft: string;
  hasImage: boolean;
  onRoute: (decision: Decision | null) => void;
}) {
  const snap = useModelSnap();
  const applyPreset = useStudio((s) => s.applyPreset);
  const setSampling = useStudio((s) => s.setSampling);
  const [purpose, setPurpose] = useState<Purpose>("route");
  const [question, setQuestion] = useState("");
  const { decision, note, pending } = useLocalDecision(draft, hasImage, purpose, question);

  useEffect(() => {
    onRoute(purpose === "route" ? decision : null);
  }, [decision, purpose, onRoute]);

  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-mono text-xs text-subtle">DECISION</p>
        <p className="text-sm text-muted">
          {LOCAL_MODEL_LABEL}
          {snap.device ? ` · ${snap.device === "webgpu" ? "WebGPU" : "WASM"}` : " · q4f16"}
        </p>
        {snap.phase === "idle" ? (
          <button
            type="button"
            className="h-9 rounded-md bg-accent px-3 text-sm text-accent-fg"
            onClick={() => void loadDecisionModel().catch(() => undefined)}
          >
            Load model
          </button>
        ) : null}
        {snap.phase === "loading" ? (
          <p className="text-sm text-muted">
            Loading {snap.progress > 0 ? `${snap.progress}%` : ""}
            {snap.detail ? ` · ${snap.detail}` : ""}
          </p>
        ) : null}
        {snap.phase === "error" ? <p className="text-sm text-muted">{snap.error}</p> : null}
        {snap.phase === "ready" ? (
          <div className="flex flex-wrap gap-1">
            {PURPOSES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  purpose === item.id
                    ? "h-9 rounded-full bg-surface-2 px-3 text-sm text-fg"
                    : "h-9 rounded-full px-3 text-sm text-muted"
                }
                onClick={() => setPurpose(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {snap.phase === "idle" ? (
        <p className="text-sm text-muted">
          A 0.5B instruct model for routing, risk, and other short decisions. About 0.5 GB, cached in
          this browser. Cyber-Tiel stays the coder.
        </p>
      ) : null}
      {purpose === "custom" && snap.phase === "ready" ? (
        <label className="block">
          <span className="sr-only">Decision question</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What should it decide?"
            className="h-9 w-full rounded-md border border-line bg-transparent px-2 text-sm text-fg outline-none placeholder:text-subtle"
          />
        </label>
      ) : null}
      {pending ? <p className="text-sm text-muted">Deciding…</p> : null}
      {purpose === "route" && decision && !decision.failed ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm text-fg">
            {decision.preset === "coding" ? "Coding" : decision.preset === "review" ? "Review" : "Vision"}
            <span className="tabular-nums text-muted"> {decision.confidence.toFixed(2)}</span>
          </p>
          <p className="font-mono text-xs tabular-nums text-subtle">
            {decision.model} · {decision.ms} ms
          </p>
          {decision.reasons.length > 0 ? (
            <p className="min-w-0 text-sm text-muted">{decision.reasons.join(", ")}</p>
          ) : null}
          {decision.hold ? <p className="text-sm text-fg">{decision.holdWhy}</p> : null}
          <button
            type="button"
            className="h-9 rounded-full bg-surface-2 px-3 text-sm text-fg"
            onClick={() => {
              applyPreset(decision.preset);
              setSampling({ maxTokens: decision.maxTokens, temperature: decision.temperature });
            }}
          >
            Apply
          </button>
        </div>
      ) : null}
      {note ? <p className="text-sm text-fg">{note}</p> : null}
    </div>
  );
}
