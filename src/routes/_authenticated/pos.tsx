import { createFileRoute } from "@tanstack/react-router";
import { PosCore } from "@/components/pos-core";

export const Route = createFileRoute("/_authenticated/pos")({
  head: () => ({ meta: [{ title: "Caisse (POS) — BoutikBF" }] }),
  component: () => <PosCore mode="owner" />,
});
