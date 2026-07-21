export const fmtMoney = (n: number, currency = "XOF") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    n || 0,
  );

export const fmtNumber = (n: number) => new Intl.NumberFormat("fr-FR").format(n || 0);

export const fmtDate = (d: string | Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(d),
  );
