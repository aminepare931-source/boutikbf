import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/employee/reports")({
  head: () => ({ meta: [{ title: "Rapports — BoutikBF" }] }),
  component: EmployeeReports,
});

function EmployeeReports() {
  return (
    <div>
      <PageHeader title="Rapports" description="Statistiques et analyses" />
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Rapports - À implémenter
        </CardContent>
      </Card>
    </div>
  );
}
