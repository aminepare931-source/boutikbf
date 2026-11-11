import { createFileRoute } from "@tanstack/react-router";
import { PosCore } from "@/components/pos-core";

export const Route = createFileRoute("/employee/pos")({
  head: () => ({ meta: [{ title: "Caisse — BoutikBF" }] }),
  component: () => <PosCore mode="employee" />,
});
