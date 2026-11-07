import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/status")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({ preview: Boolean(process.env.XAI_API_KEY) }),
    },
  },
});
