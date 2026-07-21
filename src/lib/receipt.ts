import JsBarcode from "jsbarcode";
import { fmtMoney, fmtDate } from "./format";

export type ReceiptData = {
  shop: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    currency?: string;
  };
  sale: {
    reference: string;
    created_at: string;
    payment_method: string;
    subtotal: number;
    tax?: number;
    discount?: number;
    total: number;
  };
  items: { name: string; quantity: number; unit_price: number; total: number }[];
  customer?: { name?: string | null; phone?: string | null } | null;
  mode?: "receipt" | "invoice";
};

function barcodeSvg(value: string): string {
  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, value, {
      format: "CODE128",
      width: 1.6,
      height: 40,
      displayValue: false,
      margin: 0,
    });
    return new XMLSerializer().serializeToString(svg);
  } catch {
    return "";
  }
}

const payLabel: Record<string, string> = {
  cash: "Espèces",
  mobile: "Mobile Money",
  card: "Carte bancaire",
  credit: "Crédit",
};

export function buildReceiptHtml(d: ReceiptData): string {
  const cur = d.shop.currency ?? "XOF";
  const mode = d.mode ?? "receipt";
  const title = mode === "invoice" ? "FACTURE" : "REÇU DE CAISSE";
  const items = d.items
    .map(
      (i) => `
    <tr>
      <td style="padding:6px 4px;border-bottom:1px dashed #ddd">${escapeHtml(i.name)}<br><span style="color:#888;font-size:11px">${i.quantity} × ${fmtMoney(i.unit_price, cur)}</span></td>
      <td style="padding:6px 4px;border-bottom:1px dashed #ddd;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums">${fmtMoney(i.total, cur)}</td>
    </tr>`,
    )
    .join("");

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title} · ${d.sale.reference}</title>
<style>
  * { box-sizing:border-box }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color:#111; margin:0; padding:16px; background:#f5f5f5 }
  .paper { max-width:${mode === "invoice" ? "760px" : "340px"}; margin:0 auto; background:#fff; padding:20px; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,.08) }
  .flag { height:6px; margin:-20px -20px 16px; background:linear-gradient(90deg,#009e49 0 33%,#fcd116 33% 66%,#ce1126 66% 100%) }
  h1 { font-size:16px; margin:0; text-align:center; letter-spacing:1px }
  h2 { font-size:20px; margin:8px 0 0; text-align:center }
  .muted { color:#666; font-size:12px; text-align:center }
  table { width:100%; border-collapse:collapse; margin-top:12px; font-size:13px }
  .totals td { padding:4px 4px; font-size:13px }
  .totals .grand { font-size:16px; font-weight:700; border-top:2px solid #111; padding-top:8px }
  .meta { display:flex; justify-content:space-between; font-size:12px; color:#444; margin-top:10px }
  .center { text-align:center }
  .logo { display:block; margin:0 auto 8px; max-height:60px }
  .barcode { display:flex; justify-content:center; margin-top:14px }
  .thanks { margin-top:16px; text-align:center; font-size:12px; color:#555 }
  @media print {
    body { background:#fff; padding:0 }
    .paper { box-shadow:none; border-radius:0; max-width:100% }
    .noprint { display:none !important }
  }
  .toolbar { max-width:760px; margin:0 auto 12px; display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap }
  .btn { background:#ce1126; color:#fff; border:0; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:600 }
  .btn.alt { background:#111 }
  .btn.green { background:#009e49 }
  .btn[disabled] { opacity:.6; cursor:wait }
</style>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"><\/script>
</head><body>
<div class="toolbar noprint">
  <button class="btn" onclick="window.print()">🖨️ Imprimer</button>
  <button class="btn green" id="dlpdf">⬇️ Télécharger PDF</button>
  <button class="btn alt" onclick="window.close()">Fermer</button>
</div>
<script>
  (function(){
    var btn = document.getElementById('dlpdf');
    btn.addEventListener('click', async function(){
      if (!window.html2canvas || !window.jspdf) { alert('Chargement PDF... réessayez dans un instant.'); return; }
      btn.disabled = true; btn.textContent = 'Génération...';
      try {
        var target = document.querySelector('.paper');
        var canvas = await window.html2canvas(target, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
        var img = canvas.toDataURL('image/png');
        var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        var pageW = pdf.internal.pageSize.getWidth();
        var pageH = pdf.internal.pageSize.getHeight();
        var w = pageW - 20;
        var h = canvas.height * w / canvas.width;
        var y = 10;
        if (h <= pageH - 20) {
          pdf.addImage(img, 'PNG', 10, y, w, h);
        } else {
          var remaining = h; var offset = 0;
          while (remaining > 0) {
            pdf.addImage(img, 'PNG', 10, y - offset, w, h);
            remaining -= (pageH - 20);
            offset += (pageH - 20);
            if (remaining > 0) pdf.addPage();
          }
        }
        var filename = (document.title || 'document').replace(/[^a-z0-9\-_.]+/gi,'_') + '.pdf';
        pdf.save(filename);
      } catch (e) { alert('Erreur PDF: ' + (e && e.message ? e.message : e)); }
      finally { btn.disabled = false; btn.textContent = '⬇️ Télécharger PDF'; }
    });
  })();
<\/script>
<div class="paper">
  <div class="flag"></div>
  ${d.shop.logoUrl ? `<img src="${escapeAttr(d.shop.logoUrl)}" class="logo" alt="">` : ""}
  <h2>${escapeHtml(d.shop.name)}</h2>
  <div class="muted">
    ${d.shop.address ? escapeHtml(d.shop.address) + "<br>" : ""}
    ${[d.shop.phone, d.shop.email]
      .filter((v): v is string => Boolean(v))
      .map(escapeHtml)
      .join(" · ")}
  </div>
  <h1 style="margin-top:14px">${title}</h1>
  <div class="meta">
    <span>Réf : <b>${escapeHtml(d.sale.reference)}</b></span>
    <span>${fmtDate(d.sale.created_at)}</span>
  </div>
  ${d.customer?.name ? `<div class="meta"><span>Client : <b>${escapeHtml(d.customer.name)}</b></span>${d.customer.phone ? `<span>${escapeHtml(d.customer.phone)}</span>` : ""}</div>` : ""}
  <table>
    <thead><tr><th style="text-align:left;padding:6px 4px;border-bottom:2px solid #111;font-size:12px">Article</th><th style="text-align:right;padding:6px 4px;border-bottom:2px solid #111;font-size:12px">Total</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <table class="totals" style="margin-top:8px">
    <tr><td>Sous-total</td><td style="text-align:right">${fmtMoney(d.sale.subtotal, cur)}</td></tr>
    ${d.sale.discount ? `<tr><td>Remise</td><td style="text-align:right">- ${fmtMoney(d.sale.discount, cur)}</td></tr>` : ""}
    ${d.sale.tax ? `<tr><td>TVA</td><td style="text-align:right">${fmtMoney(d.sale.tax, cur)}</td></tr>` : ""}
    <tr class="grand"><td>TOTAL</td><td style="text-align:right">${fmtMoney(d.sale.total, cur)}</td></tr>
    <tr><td colspan="2" style="padding-top:6px;color:#555">Paiement : ${payLabel[d.sale.payment_method] ?? d.sale.payment_method}</td></tr>
  </table>
  <div class="barcode">${barcodeSvg(d.sale.reference)}</div>
  <div class="thanks">Merci pour votre achat 🇧🇫<br>Généré par BoutikBF</div>
</div>
</body></html>`;
}

export function openReceipt(d: ReceiptData) {
  const html = buildReceiptHtml(d);
  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) {
    alert("Autorisez les pop-ups pour imprimer le reçu.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
function escapeAttr(s: string) {
  return escapeHtml(s);
}

/** Generate a printable page of barcode labels for a list of products. */
export function openLabels(
  products: { name: string; sku: string; sale_price: number }[],
  currency = "XOF",
) {
  const labels = products
    .map((p) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      try {
        JsBarcode(svg, p.sku, {
          format: "CODE128",
          width: 1.4,
          height: 40,
          fontSize: 10,
          margin: 2,
        });
      } catch {}
      return `<div class="lbl"><div class="n">${escapeHtml(p.name)}</div>${new XMLSerializer().serializeToString(svg)}<div class="p">${fmtMoney(p.sale_price, currency)}</div></div>`;
    })
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Étiquettes</title>
<style>
  body{font-family:sans-serif;margin:10mm;background:#fff}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}
  .lbl{border:1px dashed #999;padding:6px;text-align:center;border-radius:4px;page-break-inside:avoid}
  .n{font-size:11px;font-weight:600;margin-bottom:4px;min-height:28px}
  .p{font-size:12px;font-weight:700;margin-top:2px}
  .bar{margin:0 auto}
  .tb{margin-bottom:10px}
  button{background:#ce1126;color:#fff;border:0;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:600}
  @media print{ .tb{display:none} }
</style></head><body>
<div class="tb"><button onclick="window.print()">🖨️ Imprimer les étiquettes</button></div>
<div class="grid">${labels}</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
