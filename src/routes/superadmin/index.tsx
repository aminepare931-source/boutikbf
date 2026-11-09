import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BellRing,
  Loader2,
  MessageCircle,
  Minus,
  ShoppingCart,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminRpc,
  PLAN_LABELS,
  PLAN_PRICES,
  whatsappLink,
  type AdminDashboard,
  type DashboardShopRow,
} from "@/lib/superadmin";
import { fmtDate, fmtMoney, fmtNumber } from "@/lib/format";

export const Route = createFileRoute("/superadmin/")({ component: Dashboard });

const PERIODS = [7, 30, 90] as const;

const COLORS = {
  trial: "oklch(0.75 0.03 60)",
  paid: "oklch(0.58 0.16 155)",
  pro: "oklch(0.6 0.22 27)",
  custom: "oklch(0.68 0.17 55)",
};

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
};

/* ---------- petits utilitaires ---------- */

type Trend = { label: string; dir: "up" | "down" | "flat" };

function trend(now: number, prev: number): Trend {
  if (prev === 0) return now > 0 ? { label: "nouveau", dir: "up" } : { label: "—", dir: "flat" };
  const p = Math.round(((now - prev) / prev) * 100);
  return { label: `${p > 0 ? "+" : ""}${p} %`, dir: p > 0 ? "up" : p < 0 ? "down" : "flat" };
}

const shortDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const compact = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)} M`
    : v >= 1000
      ? `${Math.round(v / 1000)} k`
      : `${v}`;

function ago(date: string | null) {
  if (!date) return "jamais";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  return days <= 0 ? "aujourd'hui" : `il y a ${days} j`;
}

function Kpi({
  label,
  value,
  sub,
  trend: t,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: Trend;
  icon: typeof Wallet;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const toneMap = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    destructive: "from-destructive/20 to-destructive/5 text-destructive",
  };
  const TrendIcon = t?.dir === "up" ? TrendingUp : t?.dir === "down" ? TrendingDown : Minus;
  const trendColor =
    t?.dir === "up"
      ? "text-success"
      : t?.dir === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${toneMap[tone]} opacity-70 blur-2xl`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${toneMap[tone].split(" ").pop()}`} />
        </div>
        <div className="mt-3 font-display text-2xl font-bold sm:text-3xl">{value}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
          {t && (
            <span className={`inline-flex items-center gap-1 font-semibold ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              {t.label}
            </span>
          )}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function ContactButton({ row, message }: { row: DashboardShopRow; message: string }) {
  const href = whatsappLink(row.phone, message);
  if (!href)
    return (
      <span className="text-xs text-muted-foreground">{row.owner_email ?? "Pas de numéro"}</span>
    );
  return (
    <Button asChild size="sm" variant="outline" className="shrink-0">
      <a href={href} target="_blank" rel="noreferrer">
        <MessageCircle className="mr-1.5 h-4 w-4 text-success" /> WhatsApp
      </a>
    </Button>
  );
}

function ActionList({
  icon: Icon,
  title,
  empty,
  rows,
  line,
  message,
}: {
  icon: typeof Target;
  title: string;
  empty: string;
  rows: DashboardShopRow[];
  line: (r: DashboardShopRow) => string;
  message: (r: DashboardShopRow) => string;
}) {
  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{line(r)}</div>
                </div>
                <ContactButton row={r} message={message(r)} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- page ---------- */

function Dashboard() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const { data, isLoading, error } = useQuery({
    queryKey: ["sa-dashboard", days],
    queryFn: () => adminRpc<AdminDashboard>("admin_dashboard", { p_days: days }),
    placeholderData: (prev) => prev,
  });

  if (isLoading)
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-muted-foreground" />;
  if (error || !data)
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center text-sm">
        <p className="font-semibold text-destructive">
          {(error as Error)?.message ?? "Impossible de charger le tableau de bord."}
        </p>
        <p className="mt-2 text-muted-foreground">
          Si le message parle d'une fonction introuvable, exécute le fichier{" "}
          <code className="rounded bg-muted px-1">
            supabase/APPLIQUER_TABLEAU_DE_BORD_ADMIN.sql
          </code>{" "}
          dans le SQL Editor de Supabase.
        </p>
      </div>
    );

  const { totals: t, plans: p, activity: a, conversions: c } = data;

  const paidTotal = p.essentiel_paid + p.pro + p.sur_mesure;
  const mrr = p.essentiel_paid * PLAN_PRICES.essentiel_paid + p.pro * PLAN_PRICES.pro;
  const conversion =
    paidTotal + p.trials_expired > 0
      ? `${Math.round((paidTotal / (paidTotal + p.trials_expired)) * 100)} %`
      : "—";

  const planData = [
    { name: PLAN_LABELS.essentiel, value: p.essentiel, color: COLORS.trial },
    { name: PLAN_LABELS.essentiel_paid, value: p.essentiel_paid, color: COLORS.paid },
    { name: PLAN_LABELS.pro, value: p.pro, color: COLORS.pro },
    { name: PLAN_LABELS["sur-mesure"], value: p.sur_mesure, color: COLORS.custom },
  ].filter((x) => x.value > 0);

  const chartData = data.series.map((d) => ({ ...d, label: shortDay(d.day) }));
  const per = `vs ${days} j précédents`;
  const activePct = t.shops > 0 ? Math.round((a.active_30d / t.shops) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="La performance de BoutikBF : revenus, croissance et activité des boutiques."
        actions={PERIODS.map((n) => (
          <Button
            key={n}
            size="sm"
            variant={days === n ? "default" : "outline"}
            onClick={() => setDays(n)}
          >
            {n} jours
          </Button>
        ))}
      />

      <Section
        title="Revenus"
        hint="Estimation : clients payants × tarif mensuel (Essentiel 5 000 F, Pro 10 000 F)."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Revenu mensuel estimé"
            value={fmtMoney(mrr)}
            sub={`${paidTotal} client${paidTotal > 1 ? "s" : ""} payant${paidTotal > 1 ? "s" : ""}`}
            icon={Wallet}
            tone="success"
          />
          <Kpi
            label="Revenu annuel estimé"
            value={fmtMoney(mrr * 12)}
            sub={
              p.sur_mesure > 0 ? `+ ${p.sur_mesure} sur devis non compté(s)` : "si rien ne change"
            }
            icon={BadgeCheck}
            tone="success"
          />
          <Kpi
            label="Conversion des essais"
            value={conversion}
            sub={`${paidTotal} abonnés · ${p.trials_expired} essais terminés`}
            icon={Target}
          />
          <Kpi
            label={`Nouveaux abonnés (${days} j)`}
            value={fmtNumber(c.now)}
            trend={trend(c.now, c.prev)}
            sub={per}
            icon={BadgeCheck}
            tone="warning"
          />
        </div>
      </Section>

      <Section title="Croissance et usage" hint={`Les ${days} derniers jours`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Boutiques"
            value={fmtNumber(t.shops)}
            trend={trend(t.shops_p, t.shops_prev)}
            sub={`+${t.shops_p} · ${per}`}
            icon={Store}
          />
          <Kpi
            label="Utilisateurs"
            value={fmtNumber(t.users)}
            trend={trend(t.users_p, t.users_prev)}
            sub={`+${t.users_p} · ${per}`}
            icon={Users}
          />
          <Kpi
            label="Ventes enregistrées"
            value={fmtNumber(t.sales_p)}
            trend={trend(t.sales_p, t.sales_prev)}
            sub={per}
            icon={ShoppingCart}
            tone="success"
          />
          <Kpi
            label="Volume traité par vos boutiques"
            value={fmtMoney(Number(t.volume_p))}
            trend={trend(Number(t.volume_p), Number(t.volume_prev))}
            sub={per}
            icon={Wallet}
            tone="success"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Volume de ventes par jour</CardTitle>
            </CardHeader>
            <CardContent className="h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="sa-volume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.paid} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={COLORS.paid} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                  <XAxis
                    dataKey="label"
                    stroke="currentColor"
                    fontSize={10}
                    opacity={0.6}
                    minTickGap={24}
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={10}
                    opacity={0.6}
                    tickFormatter={compact}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [fmtMoney(v), "Volume"]}
                    labelFormatter={(l) => `Le ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={COLORS.paid}
                    strokeWidth={2}
                    fill="url(#sa-volume)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Répartition des formules</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {planData.length === 0 ? (
                <p className="grid h-full place-items-center text-sm text-muted-foreground">
                  Aucune boutique pour l'instant.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {planData.map((x) => (
                        <Cell key={x.name} fill={x.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">
                Nouvelles inscriptions par jour
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.06} />
                  <XAxis
                    dataKey="label"
                    stroke="currentColor"
                    fontSize={10}
                    opacity={0.6}
                    minTickGap={24}
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={10}
                    opacity={0.6}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => `Le ${l}`} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="shops" name="Boutiques" fill={COLORS.pro} radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="users"
                    name="Utilisateurs"
                    fill={COLORS.custom}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-base">Santé du parc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Boutiques actives (30 j)</span>
                <span className="font-display text-lg font-bold">{activePct} %</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${activePct}%` }}
                />
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Actives cette semaine", a.active_7d, "text-success"],
                  ["Dormantes (14 j sans vente)", a.dormant, a.dormant > 0 ? "text-warning" : ""],
                  ["N'ont jamais vendu", a.never_sold, a.never_sold > 0 ? "text-warning" : ""],
                  ["Essais en cours", p.trials_active, ""],
                  [
                    "Essais finissant sous 7 j",
                    p.trials_ending_7d,
                    p.trials_ending_7d > 0 ? "text-warning" : "",
                  ],
                  [
                    "Essais expirés",
                    p.trials_expired,
                    p.trials_expired > 0 ? "text-destructive" : "",
                  ],
                  ["Boutiques suspendues", p.suspended, p.suspended > 0 ? "text-destructive" : ""],
                ].map(([label, n, cls]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className={`font-semibold ${cls}`}>{fmtNumber(n as number)}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        title="À faire maintenant"
        hint="Contacte directement les propriétaires sur WhatsApp, message déjà rédigé."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <ActionList
            icon={Target}
            title="Essais à convertir"
            empty="Aucun essai actif avec des ventes pour l'instant."
            rows={data.hot_trials}
            line={(r) =>
              `${r.sales_all} vente${r.sales_all > 1 ? "s" : ""} · ${
                r.trial_end && new Date(r.trial_end) < new Date()
                  ? "essai terminé"
                  : `essai jusqu'au ${r.trial_end ? fmtDate(r.trial_end) : "—"}`
              }`
            }
            message={(r) =>
              `Bonjour, c'est BoutikBF. Votre boutique ${r.name} utilise bien l'application, bravo ! Souhaitez-vous passer à une formule payante pour continuer sans interruption ?`
            }
          />
          <ActionList
            icon={BellRing}
            title="Clients payants à relancer"
            empty="Tous vos clients payants ont vendu récemment. Bravo."
            rows={data.at_risk}
            line={(r) =>
              `${PLAN_LABELS[r.plan ?? ""] ?? r.plan} · dernière vente : ${ago(r.last_sale)}`
            }
            message={(r) =>
              `Bonjour, c'est BoutikBF. Nous avons remarqué que ${r.name} n'a pas enregistré de vente depuis un moment. Avez-vous besoin d'aide pour bien utiliser l'application ? Nous pouvons vous accompagner.`
            }
          />
        </div>

        <Card className="mt-4 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Trophy className="h-5 w-5 text-primary" />
              Meilleures boutiques ({days} jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_shops.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune vente enregistrée sur cette période.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">#</th>
                      <th className="py-2 pr-3 font-medium">Boutique</th>
                      <th className="py-2 pr-3 font-medium">Formule</th>
                      <th className="py-2 pr-3 text-right font-medium">Ventes</th>
                      <th className="py-2 text-right font-medium">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_shops.map((s, i) => (
                      <tr key={s.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-3 text-muted-foreground">{i + 1}</td>
                        <td className="py-2.5 pr-3 font-semibold">{s.name}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          {PLAN_LABELS[s.plan ?? ""] ?? s.plan}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {fmtNumber(s.sales_p ?? 0)}
                        </td>
                        <td className="py-2.5 text-right font-semibold tabular-nums">
                          {fmtMoney(Number(s.volume_p ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      <p className="mt-8 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Le volume traité est ce que vendent vos clients, pas votre revenu. Un client a payé par
        transfert ?
        <Link to="/superadmin/shops" className="font-medium text-primary underline">
          Change sa formule dans Boutiques
        </Link>
      </p>
    </>
  );
}
