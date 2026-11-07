import { useEffect, useRef, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import {
  ArrowUp,
  ImagePlus,
  PanelLeft,
  Plus,
  SlidersHorizontal,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shrinkImage } from "./image";
import { Markdown } from "./markdown";
import { useStudio } from "./store";
import { DecisionBar } from "./decide/bar";
import { decideRoute } from "./decide/run";
import { hardHold, LOCAL_MODEL_LABEL, type Decision } from "./decide/prompt";
import { completeLocal, completePreview, toTurns } from "./stream";
import { PRESETS, type Attachment, type ChatMessage, type Preset } from "./types";

const STARTERS: { title: string; body: string; prompt: string; preset: Preset }[] = [
  {
    title: "Patch a handler",
    body: "Diff two unified patches and return added lines.",
    preset: "coding",
    prompt:
      "Write a Python function that takes two unified diffs and returns the added line numbers per file. Include a short doctest.",
  },
  {
    title: "Review a race",
    body: "A cache fill that is not safe under concurrency.",
    preset: "review",
    prompt:
      "Review this pattern for races and missing bounds checks, then show a patched version:\n\ncache = {}\nasync def get_user(uid):\n    if uid not in cache:\n        cache[uid] = await db.fetch(uid)\n    return cache[uid]",
  },
  {
    title: "Wire mlx-vlm",
    body: "A streaming route for the local checkpoint.",
    preset: "vision",
    prompt:
      "Sketch a small FastAPI route that streams tokens from mlx_vlm.stream_generate, accepts one optional image, and clears the Metal cache when the stream ends. Python only. Do not use mlx_lm.load.",
  },
];

function uid() {
  return crypto.randomUUID();
}

export function Studio() {
  const sessions = useStudio((s) => s.sessions);
  const currentId = useStudio((s) => s.currentId);
  const sampling = useStudio((s) => s.sampling);
  const runtime = useStudio((s) => s.runtime);
  const draft = useStudio((s) => s.draft);
  const draftImage = useStudio((s) => s.draftImage);
  const select = useStudio((s) => s.select);
  const createSession = useStudio((s) => s.createSession);
  const deleteSession = useStudio((s) => s.deleteSession);
  const setDraft = useStudio((s) => s.setDraft);
  const setDraftImage = useStudio((s) => s.setDraftImage);
  const setSampling = useStudio((s) => s.setSampling);
  const applyPreset = useStudio((s) => s.applyPreset);
  const setRuntime = useStudio((s) => s.setRuntime);
  const pushTurn = useStudio((s) => s.pushTurn);
  const patchMessage = useStudio((s) => s.patchMessage);

  const [drawer, setDrawer] = useState<"sessions" | "inspector" | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewOk, setPreviewOk] = useState<boolean | null>(null);
  const [imageError, setImageError] = useState("");
  const [confirmHold, setConfirmHold] = useState(false);
  const [blocked, setBlocked] = useState<Decision | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stickRef = useRef(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const session = sessions.find((item) => item.id === currentId) ?? sessions[0];

  useEffect(() => {
    const text = draft.trim();
    const live =
      (decision && decision.text === text ? decision : null) ??
      (blocked && blocked.text === text ? blocked : null);
    if (!text || (blocked && blocked.text !== text) || (live && !live.hold)) setConfirmHold(false);
  }, [draft, decision, blocked]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/status")
      .then((res) => res.json())
      .then((body: { preview?: boolean }) => {
        if (!cancelled) setPreviewOk(Boolean(body.preview));
      })
      .catch(() => {
        if (!cancelled) setPreviewOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stickRef.current) return;
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [session?.messages, busy, draft]);

  if (!session) return null;

  const tokens = Math.round(
    (session.messages.reduce((n, m) => n + m.content.length, 0) + draft.length) / 4 +
      (draftImage ? 800 : 0),
  );
  const budget = Math.min(100, (tokens / 32000) * 100);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Use a PNG, JPEG, or WebP screenshot.");
      return;
    }
    try {
      setImageError("");
      setDraftImage(await shrinkImage(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not read that image.");
    }
  }

  async function send(text: string, preset?: Preset, force?: boolean) {
    const content = text.trim();
    if (!content || busy) return;
    if (!force) {
      const why = hardHold(content);
      if (why) {
        setBlocked({
          text: content,
          preset: "coding",
          confidence: 0,
          reasons: [],
          hold: true,
          holdWhy: why,
          maxTokens: 1400,
          temperature: 0.6,
          model: LOCAL_MODEL_LABEL,
          ms: 0,
          failed: false,
        });
        setConfirmHold(true);
        return;
      }
      const gate =
        decision && decision.text === content && !decision.failed
          ? decision
          : await decideRoute(content, Boolean(draftImage));
      if (gate.hold) {
        setBlocked(gate);
        setConfirmHold(true);
        return;
      }
    }
    setBlocked(null);
    setConfirmHold(false);
    if (preset) applyPreset(preset);
    const active = preset
      ? { preset, ...PRESETS[preset].sampling }
      : useStudio.getState().sampling;
    const runtimeNow = useStudio.getState().runtime;
    const sessionId = useStudio.getState().currentId;
    const prior = useStudio.getState().sessions.find((s) => s.id === sessionId)?.messages ?? [];
    const image = useStudio.getState().draftImage;
    const user: ChatMessage = {
      id: uid(),
      role: "user",
      content,
      createdAt: Date.now(),
      attachments: image ? [image] : undefined,
    };
    const assistantId = uid();
    const assistant: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    pushTurn(sessionId, [user, assistant]);
    setDraft("");
    setDraftImage(null);
    setBusy(true);
    stickRef.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    const started = performance.now();
    let acc = "";
    let frame = 0;
    const paint = (full: string) => {
      acc = full;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        patchMessage(sessionId, assistantId, { content: acc });
      });
    };

    try {
      const turns = toTurns([...prior, user]);
      const run =
        runtimeNow.mode === "local"
          ? completeLocal({
              runtime: runtimeNow,
              sampling: active,
              turns,
              focus: active.preset,
              signal: controller.signal,
              onText: paint,
            })
          : completePreview({
              sampling: active,
              turns,
              signal: controller.signal,
              onText: paint,
            });
      const finalText = await run;
      if (frame) cancelAnimationFrame(frame);
      patchMessage(sessionId, assistantId, {
        content: finalText,
        ms: Math.round(performance.now() - started),
      });
    } catch (error) {
      if (frame) cancelAnimationFrame(frame);
      const stopped = controller.signal.aborted;
      patchMessage(sessionId, assistantId, {
        content: acc,
        ms: Math.round(performance.now() - started),
        error: stopped
          ? acc
            ? undefined
            : "Stopped."
          : error instanceof Error
            ? error.message
            : "The turn failed.",
      });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-bg text-fg">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-4">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg lg:hidden"
          aria-label="Threads"
          onClick={() => setDrawer("sessions")}
        >
          <PanelLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h1 className="truncate text-lg font-medium tracking-tight">Cyber-Tiel</h1>
            <span className="text-sm text-muted">Studio</span>
          </div>
        </div>
        <p className="hidden font-mono text-xs text-subtle xl:block">
          35B-A3B · oQ6e · mlx-vlm
        </p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg xl:hidden"
          aria-label="Sampling and runtime"
          onClick={() => setDrawer("inspector")}
        >
          <SlidersHorizontal className="size-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <SessionColumn
          className="hidden lg:flex"
          sessions={sessions}
          currentId={session.id}
          onSelect={select}
          onCreate={createSession}
          onDelete={deleteSession}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <div
            ref={scrollerRef}
            onScroll={(event) => {
              const node = event.currentTarget;
              stickRef.current =
                node.scrollHeight - node.scrollTop - node.clientHeight < 80;
            }}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
              {session.messages.length === 0 ? (
                <Empty
                  onPick={(item) => {
                    applyPreset(item.preset);
                    void send(item.prompt, item.preset);
                  }}
                />
              ) : (
                session.messages.map((message) => (
                  <MessageView
                    key={message.id}
                    message={message}
                    streaming={busy && message.id === session.messages.at(-1)?.id}
                  />
                ))
              )}
            </div>
          </div>

          <form
            className="shrink-0 border-t border-line px-3 py-3 sm:px-4"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void onPick(event.dataTransfer.files[0]);
            }}
          >
            <div className="mx-auto w-full max-w-3xl rounded-xl border border-line bg-surface p-3">
              <DecisionBar
                draft={draft}
                hasImage={Boolean(draftImage)}
                onRoute={setDecision}
              />
              {confirmHold && (decision?.hold || blocked?.hold) ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-fg">
                    {decision?.holdWhy || blocked?.holdWhy || "Send this anyway?"}
                  </p>
                  <button
                    type="button"
                    className="h-9 rounded-md bg-accent px-3 text-sm text-accent-fg"
                    onClick={() => void send(draft, undefined, true)}
                  >
                    Send anyway
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-md px-3 text-sm text-muted"
                    onClick={() => setConfirmHold(false)}
                  >
                    Edit
                  </button>
                </div>
              ) : null}
              {draftImage ? (
                <ImageChip image={draftImage} onClear={() => setDraftImage(null)} />
              ) : null}
              {imageError ? <p className="mb-2 text-sm text-muted">{imageError}</p> : null}
              <label className="sr-only" htmlFor="prompt">
                Message
              </label>
              <textarea
                id="prompt"
                value={draft}
                rows={3}
                placeholder="Ask for a patch, a review, or what is in a screenshot."
                className="w-full resize-none rounded-md bg-transparent px-1 text-base leading-relaxed text-fg outline-none placeholder:text-subtle"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
                    aria-label="Attach screenshot"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus className="size-5" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      void onPick(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <div className="hidden gap-1 sm:flex">
                    {(Object.keys(PRESETS) as Preset[]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          "h-9 rounded-full px-3 text-sm",
                          sampling.preset === preset
                            ? "bg-surface-2 text-fg"
                            : "text-muted hover:text-fg",
                        )}
                      >
                        {PRESETS[preset].label}
                      </button>
                    ))}
                  </div>
                </div>
                {busy ? (
                  <button
                    type="button"
                    className="inline-flex size-11 items-center justify-center rounded-md bg-accent text-accent-fg"
                    aria-label="Stop"
                    onClick={() => abortRef.current?.abort()}
                  >
                    <Square className="size-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="inline-flex size-11 items-center justify-center rounded-md bg-accent text-accent-fg disabled:opacity-40"
                    aria-label="Send"
                  >
                    <ArrowUp className="size-5" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </main>

        <Inspector
          className="hidden xl:flex"
          samplingPreset={sampling.preset}
          temperature={sampling.temperature}
          topP={sampling.topP}
          topK={sampling.topK}
          maxTokens={sampling.maxTokens}
          onSampling={setSampling}
          onPreset={applyPreset}
          runtimeMode={runtime.mode}
          baseUrl={runtime.baseUrl}
          model={runtime.model}
          apiKey={runtime.apiKey}
          onRuntime={setRuntime}
          tokens={tokens}
          budget={budget}
          previewOk={previewOk}
        />
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-30 xl:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-bg/80"
            aria-label="Close"
            onClick={() => setDrawer(null)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,22rem)] flex-col border-r border-line bg-bg">
            <div className="flex h-14 items-center justify-end px-2">
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-md text-muted"
                aria-label="Close panel"
                onClick={() => setDrawer(null)}
              >
                <X className="size-5" />
              </button>
            </div>
            {drawer === "sessions" ? (
              <SessionColumn
                className="flex min-h-0 flex-1"
                sessions={sessions}
                currentId={session.id}
                onSelect={(id) => {
                  select(id);
                  setDrawer(null);
                }}
                onCreate={() => {
                  createSession();
                  setDrawer(null);
                }}
                onDelete={deleteSession}
              />
            ) : (
              <Inspector
                className="flex min-h-0 flex-1 overflow-y-auto"
                samplingPreset={sampling.preset}
                temperature={sampling.temperature}
                topP={sampling.topP}
                topK={sampling.topK}
                maxTokens={sampling.maxTokens}
                onSampling={setSampling}
                onPreset={applyPreset}
                runtimeMode={runtime.mode}
                baseUrl={runtime.baseUrl}
                model={runtime.model}
                apiKey={runtime.apiKey}
                onRuntime={setRuntime}
                tokens={tokens}
                budget={budget}
                previewOk={previewOk}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Empty({
  onPick,
}: {
  onPick: (item: (typeof STARTERS)[number]) => void;
}) {
  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="max-w-xl">
        <p className="font-mono text-xs tracking-wide text-subtle">CHECKPOINT</p>
        <h2 className="mt-2 text-2xl font-medium tracking-tight">
          A cockpit for the 35B coder.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Cyber-Tiel is a vision MoE for agentic coding. This studio streams a
          preview brain until you point it at mlx-vlm or oMLX on your Mac.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {STARTERS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onPick(item)}
            className="rounded-lg border border-line bg-surface p-4 text-left hover:bg-surface-2"
          >
            <span className="block text-sm font-medium">{item.title}</span>
            <span className="mt-1 block text-sm leading-relaxed text-muted">{item.body}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageView({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="ml-auto w-full max-w-xl rounded-lg bg-surface-2 px-4 py-3">
        {message.attachments?.map((item) => (
          <figure key={item.name} className="mb-3">
            {item.dataUrl ? (
              <img
                src={item.dataUrl}
                alt=""
                className="max-h-48 w-full rounded-md object-contain"
              />
            ) : null}
            <figcaption className="mt-1 font-mono text-xs text-subtle">
              {item.name}
              {item.width ? ` · ${item.width}×${item.height}` : ""}
            </figcaption>
          </figure>
        ))}
        <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
      </div>
    );
  }

  return (
    <article>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs text-subtle">Cyber-Tiel</p>
        {message.ms ? (
          <p className="font-mono text-xs tabular-nums text-subtle">{message.ms} ms</p>
        ) : null}
      </div>
      {streaming && !message.content ? (
        <p className="text-base text-muted">Drafting</p>
      ) : (
        <Markdown text={message.content} />
      )}
      {streaming && message.content ? (
        <span className="caret ml-0.5 text-muted" aria-hidden="true">
          |
        </span>
      ) : null}
      {message.error ? <p className="mt-3 text-sm text-muted">{message.error}</p> : null}
    </article>
  );
}

function ImageChip({ image, onClear }: { image: Attachment; onClear: () => void }) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-md bg-surface-2 p-2">
      {image.dataUrl ? (
        <img src={image.dataUrl} alt="" className="h-12 w-16 rounded-sm object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{image.name}</p>
        <p className="font-mono text-xs text-subtle">
          {image.width}×{image.height}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-md text-muted"
        aria-label="Remove screenshot"
        onClick={onClear}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function SessionColumn({
  className,
  sessions,
  currentId,
  onSelect,
  onCreate,
  onDelete,
}: {
  className?: string;
  sessions: { id: string; title: string; updatedAt: number; messages: ChatMessage[] }[];
  currentId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className={cn("min-h-0 w-64 min-w-64 max-w-64 shrink-0 basis-64 flex-col overflow-hidden border-r border-line", className)}>
      <div className="flex items-center justify-between px-3 py-3">
        <p className="font-mono text-xs text-subtle">THREADS</p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="New thread"
          onClick={onCreate}
        >
          <Plus className="size-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {sessions.map((item) => {
          const active = item.id === currentId;
          return (
            <div
              key={item.id}
              className={cn(
                "group mb-1 flex items-stretch rounded-md",
                active ? "bg-surface-2" : "hover:bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="min-w-0 flex-1 px-3 py-2 text-left"
              >
                <span className="block truncate text-sm">{item.title}</span>
                <span className="mt-0.5 block font-mono text-xs text-subtle">
                  {item.updatedAt > Date.now() - 15000
                    ? "Just now"
                    : formatDistanceToNowStrict(item.updatedAt, { addSuffix: true })}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete ${item.title}`}
                className="inline-flex w-11 items-center justify-center text-subtle hover:text-fg sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function Inspector(props: {
  className?: string;
  samplingPreset: Preset;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  onSampling: (patch: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  }) => void;
  onPreset: (preset: Preset) => void;
  runtimeMode: "preview" | "local";
  baseUrl: string;
  model: string;
  apiKey: string;
  onRuntime: (patch: Partial<{ mode: "preview" | "local"; baseUrl: string; model: string; apiKey: string }>) => void;
  tokens: number;
  budget: number;
  previewOk: boolean | null;
}) {
  return (
    <aside className={cn("min-h-0 w-80 min-w-80 max-w-80 shrink-0 basis-80 flex-col overflow-hidden border-l border-line", props.className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
        <section>
          <p className="font-mono text-xs text-subtle">RUNTIME</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["preview", "Preview"],
                ["local", "Mac runtime"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => props.onRuntime({ mode })}
                className={cn(
                  "h-11 rounded-md border text-sm",
                  props.runtimeMode === mode
                    ? "border-line bg-surface-2 text-fg"
                    : "border-transparent text-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {props.runtimeMode === "preview"
              ? props.previewOk === false
                ? "Preview inference is unavailable here. Switch to the Mac runtime."
                : "Preview uses a capped stand-in so you can work before the 30 GB checkpoint is loaded."
              : "OpenAI-compatible base URL. oMLX is usually port 8000. Load this checkpoint with mlx-vlm, not mlx-lm."}
          </p>
          {props.runtimeMode === "local" ? (
            <div className="mt-3 flex flex-col gap-2">
              <Field
                label="Base URL"
                value={props.baseUrl}
                onChange={(baseUrl) => props.onRuntime({ baseUrl })}
              />
              <Field
                label="Model id"
                value={props.model}
                onChange={(model) => props.onRuntime({ model })}
              />
              <Field
                label="API key"
                value={props.apiKey}
                secret
                onChange={(apiKey) => props.onRuntime({ apiKey })}
              />
            </div>
          ) : null}
        </section>

        <section>
          <p className="font-mono text-xs text-subtle">SAMPLING</p>
          <p className="mt-2 text-sm text-muted">{PRESETS[props.samplingPreset].hint}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {(Object.keys(PRESETS) as Preset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => props.onPreset(preset)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  props.samplingPreset === preset
                    ? "bg-accent text-accent-fg"
                    : "bg-surface-2 text-muted",
                )}
              >
                {PRESETS[preset].label}
              </button>
            ))}
          </div>
          <SliderField
            label="Temperature"
            value={props.temperature}
            min={0}
            max={1.2}
            step={0.05}
            format={(n) => n.toFixed(2)}
            onChange={(temperature) => props.onSampling({ temperature })}
          />
          <SliderField
            label="Top-p"
            value={props.topP}
            min={0.1}
            max={1}
            step={0.01}
            format={(n) => n.toFixed(2)}
            onChange={(topP) => props.onSampling({ topP })}
          />
          <SliderField
            label="Top-k"
            value={props.topK}
            min={1}
            max={80}
            step={1}
            format={(n) => String(Math.round(n))}
            onChange={(topK) => props.onSampling({ topK: Math.round(topK) })}
          />
          <SliderField
            label="Max tokens"
            value={props.maxTokens}
            min={128}
            max={2048}
            step={64}
            format={(n) => String(Math.round(n))}
            onChange={(maxTokens) => props.onSampling({ maxTokens: Math.round(maxTokens) })}
          />
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-xs text-subtle">TURN BUDGET</p>
            <p className="font-mono text-xs tabular-nums text-muted">
              {tokensLabel(props.tokens)} / 32k
            </p>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent" style={{ width: `${props.budget}%` }} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The checkpoint holds 262k. Preview turns stay inside 2k output tokens.
          </p>
        </section>

        <section className="border-t border-line pt-4">
          <p className="font-mono text-xs text-subtle">CHECKPOINT</p>
          <dl className="mt-3 space-y-2 text-sm">
            <Fact k="Weights" v="35B MoE, ~3.4B active" />
            <Fact k="Quant" v="oQ6e, about 30 GB" />
            <Fact k="Loader" v="mlx-vlm only" />
            <Fact k="Vision" v="Built-in tower" />
            <Fact k="Memory" v="Comfortable on 36 GB" />
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Abliterated weights. Keep the Mac process sandboxed. LM Studio
            mishandles this MTP build. Short decisions run on Qwen2.5-0.5B in
            the browser, on WebGPU when it is available.
          </p>
        </section>
      </div>
    </aside>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className="max-w-44 text-right text-fg">{v}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  secret,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secret?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-subtle">{label}</span>
      <input
        type={secret ? "password" : "text"}
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-line bg-bg px-3 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="mt-4 block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-fg">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 w-full accent-accent"
      />
    </label>
  );
}

function tokensLabel(tokens: number) {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return String(tokens);
}
