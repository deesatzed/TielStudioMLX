import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  focus: z.enum(["coding", "review", "vision"]).default("coding"),
  temperature: z.number().min(0).max(1.5),
  topP: z.number().min(0.05).max(1),
  maxTokens: z.number().min(64).max(2048),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
        images: z.array(z.string().max(1_800_000)).max(1).optional(),
      }),
    )
    .min(1)
    .max(16),
});

const FOCUS: Record<string, string> = {
  coding: "Bias toward a complete, runnable implementation.",
  review:
    "Bias toward a code review: races, bounds, error paths, insecure defaults, then a patched snippet.",
  vision:
    "Bias toward the attached image. Describe what is visibly there, then the engineering point. If no image is attached, say so.",
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "Preview inference is not available in this environment." },
            { status: 503 },
          );
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Could not read that request." }, { status: 400 });
        }
        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { error: "That turn is too large or incomplete." },
            { status: 400 },
          );
        }

        const data = parsed.data;
        const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
        const messages = [
          {
            role: "system",
            content: [
              "You are the stand-in inside Cyber-Tiel Studio, a cockpit for Cyber-Tiel-Coder-35B-A3B, a local vision coding model.",
              "Answer as a sharp coding model: lead with the solution, use fenced code blocks with language tags, keep prose tight.",
              "Stay inside software engineering and defensive review. Refuse malware, exploits, and intrusion steps.",
              FOCUS[data.focus] ?? FOCUS.coding,
            ].join(" "),
          },
          ...data.messages.slice(-12).map((message) => {
            const isLast = message === lastUser;
            const image = isLast ? message.images?.[0] : undefined;
            if (
              image &&
              /^data:image\/(jpeg|png|webp|gif);base64,/.test(image)
            ) {
              return {
                role: message.role,
                content: [
                  { type: "text", text: message.content || "What is in this image?" },
                  { type: "image_url", image_url: { url: image } },
                ],
              };
            }
            const note = message.images?.length ? "\n[screenshot attached earlier]" : "";
            return { role: message.role, content: `${message.content}${note}` };
          }),
        ];

        let upstream: Response;
        try {
          upstream = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            signal: request.signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "grok-4.5",
              stream: true,
              temperature: data.temperature,
              top_p: data.topP,
              max_tokens: data.maxTokens,
              messages,
            }),
          });
        } catch (error) {
          if (
            request.signal.aborted ||
            (error instanceof Error && error.name === "AbortError")
          ) {
            return new Response(null, { status: 499 });
          }
          return Response.json(
            { error: "Preview inference could not be reached." },
            { status: 502 },
          );
        }

        if (!upstream.ok || !upstream.body) {
          return Response.json(
            { error: `Preview inference failed (${upstream.status}).` },
            { status: 502 },
          );
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
