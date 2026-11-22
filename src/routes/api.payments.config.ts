import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/config")({
  server: {
    handlers: {
      GET: async () => {
        const { handleConfigRequest } = await import("@/lib/payments/http.server");
        return handleConfigRequest();
      },
    },
  },
});
