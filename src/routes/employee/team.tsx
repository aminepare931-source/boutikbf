import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-parts";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/employee/team")({
  head: () => ({ meta: [{ title: "Mon équipe — BoutikBF" }] }),
  component: EmployeeTeam,
});

function EmployeeTeam() {
  return (
    <div>
      <PageHeader title="Mon équipe" description="Gestion des employés" />
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Gestion de l'équipe - À implémenter
        </CardContent>
      </Card>
    </div>
  );
}
