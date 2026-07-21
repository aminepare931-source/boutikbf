import { type ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary shadow-elegant">
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: any;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const toneMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-elegant">
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${toneMap[tone]} opacity-70 blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneMap[tone].split(" ").pop()}`} />
        </div>
        <div className="mt-3 font-display text-3xl font-bold">{value}</div>
        {delta && <div className="mt-1 text-xs text-success">{delta}</div>}
      </div>
    </div>
  );
}
