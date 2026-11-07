import type { Attachment, ChatMessage, RuntimeSettings, Sampling } from "./types";

export type Turn = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

export function toTurns(messages: ChatMessage[]): Turn[] {
  return messages
    .filter((message) => message.role === "user" || message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content,
      images: imagesOf(message.attachments),
    }));
}

function imagesOf(attachments: Attachment[] | undefined): string[] | undefined {
  const urls = (attachments ?? [])
    .map((item) => item.dataUrl)
    .filter((url): url is string => Boolean(url));
  return urls.length > 0 ? urls : undefined;
}

export async function readCompletion(
  response: Response,
  onText: (full: string) => void,
): Promise<string> {
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await response.json()) as {
      error?: string;
      choices?: { message?: { content?: string } }[];
    };
    if (!response.ok) {
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    const text = body.choices?.[0]?.message?.content ?? "";
    onText(text);
    return text;
  }
  if (!response.ok || !response.body) {
    throw new Error(`Request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          choices?: { delta?: { content?: string }; message?: { content?: string } }[];
          error?: { message?: string };
        };
        if (json.error?.message) throw new Error(json.error.message);
        const piece =
          json.choices?.[0]?.delta?.content ??
          json.choices?.[0]?.message?.content ??
          "";
        if (piece) {
          full += piece;
          onText(full);
        }
      } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
  }
  return full;
}

export async function completeLocal(options: {
  runtime: RuntimeSettings;
  sampling: Sampling;
  turns: Turn[];
  focus: Sampling["preset"];
  signal: AbortSignal;
  onText: (full: string) => void;
}): Promise<string> {
  const base = options.runtime.baseUrl.trim().replace(/\/$/, "");
  if (!base) throw new Error("Add the runtime URL first.");
  const endpoint = `${base}/v1/chat/completions`;
  const body = {
    model: options.runtime.model.trim() || "cyber-tiel",
    stream: true,
    temperature: options.sampling.temperature,
    top_p: options.sampling.topP,
    max_tokens: options.sampling.maxTokens,
    messages: localMessages(options.turns, options.focus),
  };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.runtime.apiKey.trim()) {
    headers.Authorization = `Bearer ${options.runtime.apiKey.trim()}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, top_k: options.sampling.topK }),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal.aborted) throw error;
    throw new Error(
      "The browser could not reach that runtime. It may be offline, or it is blocking this page.",
    );
  }

  if (response.status === 400) {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });
  }

  if (!response.ok) throw new Error(localError(response.status));
  return readCompletion(response, options.onText);
}

function localError(status: number): string {
  if (status === 401 || status === 403) return "The runtime rejected the key.";
  if (status === 404) return "That URL has no /v1/chat/completions endpoint.";
  return `Runtime refused the request (${status}). If this is oMLX or mlx-vlm, allow this page's origin.`;
}

function localMessages(turns: Turn[], focus: Sampling["preset"]) {
  const focusLine =
    focus === "review"
      ? "Review for races, bounds, and insecure defaults, then show a patch."
      : focus === "vision"
        ? "If an image is present, describe what is on screen before suggesting code."
        : "Implement directly. Prefer a complete snippet.";
  return [
    {
      role: "system",
      content: `You are Cyber-Tiel, a local agentic coding model. ${focusLine} Use fenced code blocks. Do not write malware or intrusion steps.`,
    },
    ...turns.map((turn, index) => {
      const last = index === turns.length - 1;
      if (turn.role === "user" && last && turn.images?.length) {
        return {
          role: "user",
          content: [
            { type: "text", text: turn.content },
            ...turn.images.map((url) => ({
              type: "image_url",
              image_url: { url },
            })),
          ],
        };
      }
      const note = turn.images?.length ? "\n[screenshot attached]" : "";
      return { role: turn.role, content: `${turn.content}${note}` };
    }),
  ];
}

export async function completePreview(options: {
  sampling: Sampling;
  turns: Turn[];
  signal: AbortSignal;
  onText: (full: string) => void;
}): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
    body: JSON.stringify({
      focus: options.sampling.preset,
      temperature: options.sampling.temperature,
      topP: options.sampling.topP,
      maxTokens: options.sampling.maxTokens,
      messages: options.turns.map((turn) => ({
        role: turn.role,
        content: turn.content.slice(0, 12000),
        images: turn.images?.slice(0, 1),
      })),
    }),
  });

  if (!response.ok && (response.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error || `Preview failed (${response.status})`);
  }
  return readCompletion(response, options.onText);
}
