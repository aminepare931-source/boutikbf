import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Hammer,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  ScanBarcode,
  Search,
  SprayCan,
  Sparkles,
  CupSoda,
  Trash2,
  Wheat,
  type LucideIcon,
} from "lucide-react";

/* ---------- données de démonstration ---------- */

type Cat = "Alimentation" | "Boissons" | "Quincaillerie" | "Entretien" | "Hygiène";

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  cat: Cat;
  stock: number;
}

const CATS: ("Tout" | Cat)[] = [
  "Tout",
  "Alimentation",
  "Boissons",
  "Quincaillerie",
  "Entretien",
  "Hygiène",
];

const PRODUCTS: Product[] = [
  {
    id: "riz",
    name: "Riz Bagré",
    unit: "5 kg",
    price: 3500,
    cat: "Alimentation",
    stock: 24,
  },
  {
    id: "huile",
    name: "Huile SN CITEC",
    unit: "1 L",
    price: 1200,
    cat: "Alimentation",
    stock: 40,
  },
  {
    id: "sucre",
    name: "Sucre SOSUCO",
    unit: "1 kg",
    price: 850,
    cat: "Alimentation",
    stock: 6,
  },
  {
    id: "pates",
    name: "Spaghetti",
    unit: "500 g",
    price: 500,
    cat: "Alimentation",
    stock: 35,
  },
  {
    id: "lait",
    name: "Lait en poudre",
    unit: "400 g",
    price: 2800,
    cat: "Alimentation",
    stock: 12,
  },
  {
    id: "tomate",
    name: "Tomate concentrée",
    unit: "210 g",
    price: 600,
    cat: "Alimentation",
    stock: 3,
  },
  {
    id: "eau",
    name: "Eau minérale",
    unit: "1,5 L",
    price: 500,
    cat: "Boissons",
    stock: 60,
  },
  {
    id: "bissap",
    name: "Jus de bissap",
    unit: "50 cl",
    price: 400,
    cat: "Boissons",
    stock: 18,
  },
  {
    id: "soda",
    name: "Boisson gazeuse",
    unit: "33 cl",
    price: 400,
    cat: "Boissons",
    stock: 48,
  },
  {
    id: "ciment",
    name: "Ciment CPJ45",
    unit: "sac",
    price: 5500,
    cat: "Quincaillerie",
    stock: 30,
  },
  {
    id: "fer",
    name: "Fer de 10",
    unit: "barre",
    price: 3200,
    cat: "Quincaillerie",
    stock: 22,
  },
  {
    id: "clous",
    name: "Clous",
    unit: "1 kg",
    price: 1000,
    cat: "Quincaillerie",
    stock: 4,
  },
  {
    id: "savon",
    name: "Savon Kobi",
    unit: "lot de 4",
    price: 1000,
    cat: "Entretien",
    stock: 26,
  },
  {
    id: "javel",
    name: "Eau de Javel",
    unit: "1 L",
    price: 600,
    cat: "Entretien",
    stock: 15,
  },
  {
    id: "lessive",
    name: "Lessive en poudre",
    unit: "1 kg",
    price: 1500,
    cat: "Entretien",
    stock: 9,
  },
  {
    id: "dents",
    name: "Dentifrice",
    unit: "75 ml",
    price: 800,
    cat: "Hygiène",
    stock: 20,
  },
  {
    id: "papier",
    name: "Papier toilette",
    unit: "lot de 4",
    price: 1000,
    cat: "Hygiène",
    stock: 14,
  },
];

const CAT_ICONS: Record<Cat, LucideIcon> = {
  Alimentation: Wheat,
  Boissons: CupSoda,
  Quincaillerie: Hammer,
  Entretien: SprayCan,
  Hygiène: Sparkles,
};

function CategoryIcon({ cat, className = "h-6 w-6" }: { cat: Cat; className?: string }) {
  const Icon = CAT_ICONS[cat];
  return <Icon className={className} />;
}

const CUSTOMERS = [
  { id: "passage", name: "Client de passage" },
  { id: "awa", name: "Awa Compaoré" },
  { id: "moussa", name: "Moussa Sawadogo" },
  { id: "salimata", name: "Salimata Kaboré" },
];

const METHODS = [
  { id: "orange", label: "Orange Money", color: "#ff7900", mobile: true },
  { id: "moov", label: "Moov Money", color: "#0057b8", mobile: true },
  { id: "wave", label: "Wave", color: "#1dc8ff", mobile: true },
  { id: "cash", label: "Espèces", color: "#0b7a42", mobile: false },
] as const;
type MethodId = (typeof METHODS)[number]["id"];

const START_STATS = { sales: 245750, tx: 127, items: 284 };

interface Sale {
  no: string;
  time: string;
  method: string;
  total: number;
}
const START_HISTORY: Sale[] = [
  { no: "TX-100127", time: "14:32", method: "Orange Money", total: 12500 },
  { no: "TX-100126", time: "14:18", method: "Espèces", total: 4300 },
];

interface Receipt {
  no: string;
  date: string;
  customer: string;
  lines: { name: string; unit: string; qty: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  method: string;
  isCash: boolean;
  received: number;
  change: number;
  points: number;
}

const money = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");

function quickAmounts(total: number) {
  const set = new Set<number>([total]);
  [1000, 5000, 10000].forEach((step) => set.add(Math.ceil(total / step) * step));
  return [...set].sort((a, b) => a - b).slice(0, 4);
}

/* ---------- composant ---------- */

export function PosSimulator() {
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.stock])),
  );
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState<"Tout" | Cat>("Tout");
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState("passage");
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<MethodId>("orange");
  const [given, setGiven] = useState("");
  const [stage, setStage] = useState<"shop" | "processing" | "receipt">("shop");
  const [procStep, setProcStep] = useState(0);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [stats, setStats] = useState(START_STATS);
  const [history, setHistory] = useState<Sale[]>(START_HISTORY);
  const [flash, setFlash] = useState<string | null>(null);
  const [live, setLive] = useState("");

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = PRODUCTS.find((x) => x.id === id)!;
    return { p, qty, total: p.price * qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const discountAmount = Math.round((subtotal * discount) / 100);
  const total = subtotal - discountAmount;
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const isCash = method === "cash";
  const received = Number(given.replace(/\D/g, "")) || 0;
  const canPay = lines.length > 0 && (!isCash || received >= total);
  const methodInfo = METHODS.find((m) => m.id === method)!;

  const visible = PRODUCTS.filter(
    (p) =>
      (cat === "Tout" || p.cat === cat) &&
      (query.trim() === "" || p.name.toLowerCase().includes(query.trim().toLowerCase())),
  );

  /* panier */
  const add = (id: string) => {
    const p = PRODUCTS.find((x) => x.id === id)!;
    if ((cart[id] || 0) >= stock[id]) return;
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    setFlash(id);
    window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 600);
    setLive(`${p.name} ajouté au panier`);
  };
  const dec = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  const remove = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  const scan = () => {
    const pool = PRODUCTS.filter((p) => (cart[p.id] || 0) < stock[p.id]);
    if (pool.length === 0) return;
    const p = pool[Math.floor(Math.random() * pool.length)];
    add(p.id);
    setLive(`Article scanné : ${p.name}`);
  };

  /* encaissement */
  const finish = (snap: Receipt, sold: Record<string, number>) => {
    setReceipt(snap);
    setStock((s) => {
      const next = { ...s };
      Object.entries(sold).forEach(([id, q]) => (next[id] = Math.max(0, next[id] - q)));
      return next;
    });
    const qtySum = Object.values(sold).reduce((a, b) => a + b, 0);
    setStats((s) => ({ sales: s.sales + snap.total, tx: s.tx + 1, items: s.items + qtySum }));
    setHistory((h) =>
      [
        { no: snap.no, time: snap.date.slice(-5), method: snap.method, total: snap.total },
        ...h,
      ].slice(0, 4),
    );
    setCart({});
    setGiven("");
    setDiscount(0);
    setStage("receipt");
  };

  const pay = () => {
    if (!canPay) return;
    const custName = CUSTOMERS.find((c) => c.id === customer)!.name;
    const snap: Receipt = {
      no: `TX-${100000 + stats.tx + 1}`,
      date: new Date()
        .toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
        .replace(",", ""),
      customer: custName,
      lines: lines.map((l) => ({ name: l.p.name, unit: l.p.unit, qty: l.qty, total: l.total })),
      subtotal,
      discount: discountAmount,
      total,
      method: methodInfo.label,
      isCash,
      received: isCash ? received : total,
      change: isCash ? received - total : 0,
      points: customer === "passage" ? 0 : Math.floor(total / 100),
    };
    const sold = { ...cart };
    if (!methodInfo.mobile) {
      finish(snap, sold);
      return;
    }
    setStage("processing");
    setProcStep(0);
    clearTimers();
    timers.current.push(window.setTimeout(() => setProcStep(1), 900));
    timers.current.push(window.setTimeout(() => setProcStep(2), 2100));
    timers.current.push(window.setTimeout(() => finish(snap, sold), 2700));
  };

  const cancelPayment = () => {
    clearTimers();
    setStage("shop");
  };
  const newSale = () => {
    setReceipt(null);
    setStage("shop");
  };
  const resetDemo = () => {
    clearTimers();
    setStock(Object.fromEntries(PRODUCTS.map((p) => [p.id, p.stock])));
    setCart({});
    setStats(START_STATS);
    setHistory(START_HISTORY);
    setReceipt(null);
    setGiven("");
    setDiscount(0);
    setCustomer("passage");
    setStage("shop");
  };

  const stat = (label: string, value: string, tint: string, delta: string) => (
    <div className={`rounded-2xl p-4 ${tint}`}>
      <p className="text-xs font-semibold text-bk-ink/70">{label}</p>
      <p
        key={value}
        className="bk-pop mt-1 font-jakarta text-xl font-extrabold text-bk-ink sm:text-2xl"
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-bk">{delta}</p>
    </div>
  );
  const soldToday = stats.sales - START_STATS.sales;

  return (
    <section id="simulateur" className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
      <div className="rounded-[2.5rem] bg-gradient-to-b from-bk-mint/70 to-white p-4 sm:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-bk shadow-sm">
            Essayez la caisse
          </span>
          <h2 className="mt-4 font-jakarta text-3xl font-extrabold leading-tight tracking-tight text-bk-ink sm:text-4xl">
            Encaissez une vente, pour de vrai, dès maintenant
          </h2>
          <p className="mt-3 text-bk-ink/75">
            Ajoutez des articles, scannez-en un, choisissez Orange Money, Moov, Wave ou espèces : le
            stock et les ventes du jour se mettent à jour sous vos yeux. Démonstration : aucun
            paiement réel.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-5 lg:grid-cols-[1.45fr_1fr]">
          {/* ---------- colonne gauche : chiffres, catalogue, historique ---------- */}
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {stat(
                "Ventes du jour",
                `${money(stats.sales)} F`,
                "bg-emerald-50",
                soldToday > 0
                  ? `+${money(soldToday)} F depuis votre essai`
                  : "Mise à jour en direct",
              )}
              {stat(
                "Transactions",
                String(stats.tx),
                "bg-sky-50",
                stats.tx > START_STATS.tx
                  ? `+${stats.tx - START_STATS.tx} depuis votre essai`
                  : "Mise à jour en direct",
              )}
              {stat(
                "Produits vendus",
                String(stats.items),
                "bg-violet-50",
                stats.items > START_STATS.items
                  ? `+${stats.items - START_STATS.items} depuis votre essai`
                  : "Mise à jour en direct",
              )}
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(10,59,37,0.07)] sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Rechercher un article</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bk-ink/45" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un article"
                    className="w-full rounded-full border border-bk-ink/10 bg-bk-mint/40 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-bk focus:ring-2 focus:ring-bk/20"
                  />
                </label>
                <button
                  type="button"
                  onClick={scan}
                  disabled={stage !== "shop"}
                  className="inline-flex items-center gap-2 rounded-full bg-bk-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-40"
                >
                  <ScanBarcode className="h-4 w-4" />
                  Scanner un article
                </button>
              </div>

              <div
                className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="tablist"
                aria-label="Catégories"
              >
                {CATS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={cat === c}
                    onClick={() => setCat(c)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      cat === c ? "bg-bk text-white" : "bg-bk-mint text-bk hover:bg-bk-mint/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {visible.map((p) => {
                  const inCart = cart[p.id] || 0;
                  const left = stock[p.id] - inCart;
                  const out = stock[p.id] === 0;
                  const maxed = left <= 0;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => add(p.id)}
                        disabled={stage !== "shop" || maxed}
                        aria-label={`Ajouter ${p.name} ${p.unit}, ${money(p.price)} francs CFA`}
                        className={`relative flex h-full w-full flex-col rounded-2xl border bg-white p-3 text-left transition hover:border-bk/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55 ${
                          flash === p.id ? "border-bk ring-2 ring-bk/30" : "border-bk-ink/10"
                        }`}
                      >
                        <span
                          className="grid h-12 w-12 place-items-center rounded-xl bg-bk-mint text-bk"
                          aria-hidden="true"
                        >
                          <CategoryIcon cat={p.cat} />
                        </span>
                        <span className="mt-2 text-sm font-bold leading-tight text-bk-ink">
                          {p.name}
                        </span>
                        <span className="text-xs text-bk-ink/60">{p.unit}</span>
                        <span className="mt-2 font-jakarta text-sm font-extrabold text-bk">
                          {money(p.price)} F
                        </span>
                        <span
                          className={`mt-1 text-[11px] font-semibold ${
                            out ? "text-red-600" : left <= 5 ? "text-amber-600" : "text-bk-ink/50"
                          }`}
                        >
                          {out ? "Épuisé" : left <= 5 ? `Plus que ${left}` : `Stock : ${left}`}
                        </span>
                        {inCart > 0 && (
                          <span className="absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-bk px-1.5 text-xs font-bold text-white">
                            {inCart}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {visible.length === 0 && (
                <p className="py-8 text-center text-sm text-bk-ink/60">
                  Aucun article ne correspond à votre recherche.
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(10,59,37,0.07)] sm:p-5">
              <h3 className="font-jakarta text-base font-bold text-bk-ink">Dernières ventes</h3>
              <ul className="mt-3 divide-y divide-bk-ink/10 text-sm">
                {history.map((s) => (
                  <li key={s.no} className="flex items-center justify-between gap-3 py-2.5">
                    <span>
                      <strong className="font-semibold text-bk-ink">{s.no}</strong>
                      <span className="ml-2 text-bk-ink/55">
                        {s.time} · {s.method}
                      </span>
                    </span>
                    <span className="font-jakarta font-extrabold text-bk">{money(s.total)} F</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ---------- colonne droite : ticket / paiement ---------- */}
          <aside
            className="rounded-3xl bg-white p-4 shadow-[0_18px_50px_rgba(10,59,37,0.12)] sm:p-5 lg:sticky lg:top-24"
            aria-label="Caisse"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-jakarta text-lg font-extrabold text-bk-ink">Caisse n°1</h3>
              <button
                type="button"
                onClick={resetDemo}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-bk-ink/65 hover:bg-bk-mint hover:text-bk"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            </div>

            {stage === "shop" && (
              <>
                <label className="mt-3 block">
                  <span className="text-xs font-semibold text-bk-ink/65">Client</span>
                  <select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-bk-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-bk focus:ring-2 focus:ring-bk/20"
                  >
                    {CUSTOMERS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-4 min-h-28">
                  {lines.length === 0 ? (
                    <p className="rounded-2xl border-2 border-dashed border-bk/25 bg-bk-mint/40 px-4 py-8 text-center text-sm text-bk-ink/70">
                      Panier vide. Touchez un article ou scannez-en un pour commencer la vente.
                    </p>
                  ) : (
                    <ul className="space-y-2.5">
                      {lines.map((l) => (
                        <li
                          key={l.p.id}
                          className="flex items-center gap-3 rounded-2xl bg-bk-mint/40 p-2.5"
                        >
                          <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-bk"
                            aria-hidden="true"
                          >
                            <CategoryIcon cat={l.p.cat} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-bk-ink">
                              {l.p.name}
                            </span>
                            <span className="text-xs text-bk-ink/60">
                              {l.p.unit} · {money(l.p.price)} F
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => dec(l.p.id)}
                              aria-label={`Retirer un ${l.p.name}`}
                              className="grid h-7 w-7 place-items-center rounded-full bg-white text-bk shadow-sm hover:bg-bk hover:text-white"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold tabular-nums">
                              {l.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => add(l.p.id)}
                              disabled={l.qty >= stock[l.p.id]}
                              aria-label={`Ajouter un ${l.p.name}`}
                              className="grid h-7 w-7 place-items-center rounded-full bg-white text-bk shadow-sm hover:bg-bk hover:text-white disabled:opacity-40"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(l.p.id)}
                            aria-label={`Supprimer ${l.p.name} du panier`}
                            className="text-bk-ink/40 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-semibold text-bk-ink/65">Remise</span>
                  {[0, 5, 10].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscount(d)}
                      aria-pressed={discount === d}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                        discount === d
                          ? "bg-bk text-white"
                          : "bg-bk-mint text-bk hover:bg-bk-mint/70"
                      }`}
                    >
                      {d === 0 ? "Aucune" : `${d} %`}
                    </button>
                  ))}
                </div>

                <dl
                  className="mt-4 space-y-1.5 border-t border-bk-ink/10 pt-4 text-sm"
                  aria-live="polite"
                >
                  <div className="flex justify-between text-bk-ink/70">
                    <dt>
                      Sous-total ({itemCount} article{itemCount > 1 ? "s" : ""})
                    </dt>
                    <dd className="tabular-nums">{money(subtotal)} F</dd>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-bk">
                      <dt>Remise {discount} %</dt>
                      <dd className="tabular-nums">− {money(discountAmount)} F</dd>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between pt-1">
                    <dt className="font-bold text-bk-ink">Total à payer</dt>
                    <dd className="font-jakarta text-2xl font-extrabold tabular-nums text-bk">
                      {money(total)} F
                    </dd>
                  </div>
                </dl>

                <fieldset className="mt-4">
                  <legend className="text-xs font-semibold text-bk-ink/65">Mode de paiement</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        aria-pressed={method === m.id}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition ${
                          method === m.id
                            ? "border-bk bg-bk-mint text-bk-ink"
                            : "border-bk-ink/10 text-bk-ink/75 hover:border-bk/40"
                        }`}
                      >
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ background: m.color }}
                          aria-hidden="true"
                        />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {isCash && lines.length > 0 && (
                  <div className="mt-3 rounded-2xl bg-bk-mint/50 p-3">
                    <label
                      className="block text-xs font-semibold text-bk-ink/65"
                      htmlFor="pos-given"
                    >
                      Montant reçu du client
                    </label>
                    <input
                      id="pos-given"
                      inputMode="numeric"
                      value={given}
                      onChange={(e) => setGiven(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="mt-1 w-full rounded-xl border border-bk-ink/10 bg-white px-3 py-2 text-right font-jakarta text-lg font-extrabold outline-none focus:border-bk focus:ring-2 focus:ring-bk/20"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quickAmounts(total).map((a, i) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setGiven(String(a))}
                          className="rounded-full bg-white px-3 py-1 text-xs font-bold text-bk shadow-sm hover:bg-bk hover:text-white"
                        >
                          {i === 0 ? "Exact" : money(a)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-bk-ink" aria-live="polite">
                      {received === 0
                        ? "Saisissez le montant reçu."
                        : received >= total
                          ? `Monnaie à rendre : ${money(received - total)} F`
                          : `Il manque ${money(total - received)} F`}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={pay}
                  disabled={!canPay}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bk px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-bk/25 transition hover:bg-bk-dark disabled:cursor-not-allowed disabled:bg-bk-ink/25 disabled:shadow-none"
                >
                  {lines.length === 0 ? "Ajoutez un article" : `Encaisser ${money(total)} F`}
                  {lines.length > 0 && <ArrowRight className="h-5 w-5" />}
                </button>
              </>
            )}

            {stage === "processing" && (
              <div className="mt-6 text-center">
                <p className="font-jakarta text-3xl font-extrabold text-bk">{money(total)} F</p>
                <p className="mt-1 text-sm text-bk-ink/65">Paiement {methodInfo.label}</p>
                <ol
                  className="mx-auto mt-6 max-w-xs space-y-3 text-left text-sm"
                  aria-live="polite"
                >
                  {[
                    "Demande envoyée au client",
                    "Confirmation sur le téléphone du client",
                    "Paiement reçu",
                  ].map((label, i) => (
                    <li
                      key={label}
                      className={`flex items-center gap-3 ${i > procStep ? "text-bk-ink/35" : "text-bk-ink"}`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                          i < procStep || procStep === 2 ? "bg-bk text-white" : "bg-bk-mint text-bk"
                        }`}
                      >
                        {i < procStep || procStep === 2 ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        ) : i === procStep ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : null}
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  onClick={cancelPayment}
                  className="mt-6 text-sm font-semibold text-bk-ink/60 underline underline-offset-4 hover:text-bk"
                >
                  Annuler
                </button>
              </div>
            )}

            {stage === "receipt" && receipt && (
              <div className="mt-4">
                <p className="flex items-center gap-2 text-sm font-bold text-bk">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-bk text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  Paiement reçu. Le stock et les ventes du jour sont à jour.
                </p>
                <div
                  className="bk-print mx-auto mt-4 max-w-[19rem] bg-[#fbfaf5] px-5 pb-8 pt-5 font-mono text-[12px] leading-relaxed text-bk-ink shadow-[0_6px_24px_rgba(10,59,37,0.14)]"
                  style={{
                    WebkitMask:
                      "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%",
                    mask: "conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%",
                  }}
                >
                  <p className="text-center font-jakarta text-base font-extrabold">BoutikBF</p>
                  <p className="text-center text-[11px] text-bk-ink/60">
                    Boutique Démo · Gérez. Vendez. Grandissez.
                  </p>
                  <p className="mt-3 flex justify-between">
                    <span>{receipt.date}</span>
                    <span>{receipt.no}</span>
                  </p>
                  <p>Client : {receipt.customer}</p>
                  <hr className="my-2 border-dashed border-bk-ink/40" />
                  {receipt.lines.map((l) => (
                    <p key={l.name} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">
                        {l.qty} × {l.name} {l.unit}
                      </span>
                      <span className="shrink-0 tabular-nums">{money(l.total)}</span>
                    </p>
                  ))}
                  <hr className="my-2 border-dashed border-bk-ink/40" />
                  <p className="flex justify-between">
                    <span>Sous-total</span>
                    <span className="tabular-nums">{money(receipt.subtotal)}</span>
                  </p>
                  {receipt.discount > 0 && (
                    <p className="flex justify-between">
                      <span>Remise</span>
                      <span className="tabular-nums">− {money(receipt.discount)}</span>
                    </p>
                  )}
                  <p className="mt-1 flex justify-between text-sm font-bold">
                    <span>TOTAL FCFA</span>
                    <span className="tabular-nums">{money(receipt.total)}</span>
                  </p>
                  <p className="mt-1 flex justify-between">
                    <span>Payé par</span>
                    <span>{receipt.method}</span>
                  </p>
                  {receipt.isCash && (
                    <>
                      <p className="flex justify-between">
                        <span>Reçu</span>
                        <span className="tabular-nums">{money(receipt.received)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>Monnaie rendue</span>
                        <span className="tabular-nums">{money(receipt.change)}</span>
                      </p>
                    </>
                  )}
                  {receipt.points > 0 && (
                    <p className="mt-2 text-center">+{receipt.points} points fidélité</p>
                  )}
                  <p className="mt-3 text-center">Merci pour votre achat !</p>
                </div>

                <button
                  type="button"
                  onClick={newSale}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-bk px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-bk/25 hover:bg-bk-dark"
                >
                  Nouvelle vente
                </button>
                <Link
                  to="/auth"
                  className="mt-3 block text-center text-sm font-semibold text-bk underline underline-offset-4"
                >
                  Ça vous plaît ? Essayez avec vos vrais produits
                </Link>
              </div>
            )}
          </aside>
        </div>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </section>
  );
}
