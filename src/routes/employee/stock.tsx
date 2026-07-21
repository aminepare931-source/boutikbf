import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/employee/stock")({
  head: () => ({ meta: [{ title: "Stock — BoutikBF" }] }),
  component: EmployeeStock,
});

function EmployeeStock() {
  return (
    <div>
      <PageHeader title="Stock" description="Gestion des stocks" />
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Gestion des stocks - À implémenter
        </CardContent>
      </Card>
    </div>
  );
}
