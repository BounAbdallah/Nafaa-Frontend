/**
 * printDocument.js
 * Génère un document HTML autonome (fiche propre) et l'ouvre dans
 * une nouvelle fenêtre pour impression ou export PDF.
 * Aucune dépendance externe — fonctionne dans tous les navigateurs.
 */

const fmt = (n) =>
  new Intl.NumberFormat('fr-FR').format(n ?? 0) + ' FCFA'

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'

const today = () => new Date().toLocaleDateString('fr-FR')

/** Styles CSS communs injectés dans chaque document imprimé */
const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1e293b;
    background: #fff;
    padding: 32px 40px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
  h2 { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;
       text-transform: uppercase; letter-spacing: .05em; }
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 22px;
  }
  .header-brand { font-size: 18px; font-weight: 900; color: #0f172a; }
  .header-meta  { font-size: 11px; color: #64748b; text-align: right; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700;
  }
  .badge-green  { background: #dcfce7; color: #15803d; }
  .badge-amber  { background: #fef3c7; color: #92400e; }
  .badge-red    { background: #fee2e2; color: #b91c1c; }
  .badge-blue   { background: #dbeafe; color: #1d4ed8; }
  .section { margin-bottom: 22px; }
  .card {
    border: 1px solid #e2e8f0; border-radius: 8px;
    padding: 16px; margin-bottom: 16px;
  }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 32px; }
  .info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 12px;
  }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #64748b; font-weight: 600; text-transform: uppercase;
                font-size: 10px; letter-spacing: .04em; }
  .info-value { color: #0f172a; font-weight: 500; text-align: right; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
  th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700;
       color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
  th.right, td.right { text-align: right; }
  th.center, td.center { text-align: center; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tbody tr:last-child td { border-bottom: none; }
  tfoot tr { background: #f8fafc; border-top: 2px solid #e2e8f0; }
  tfoot td { padding: 10px 12px; font-weight: 800; font-size: 13px; }
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stat-box {
    border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; text-align: center;
  }
  .stat-value { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
  .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
  .stat-sub   { font-size: 10px; color: #94a3b8; }
  .alert-box {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-top: 10px;
  }
  .alert-red    { background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; }
  .alert-amber  { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; }
  .footer {
    margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;
  }
  @media print {
    body { padding: 16px 24px; }
    @page { margin: 1cm; }
  }
`

/** Ouvre une nouvelle fenêtre, injecte le HTML et déclenche l'impression */
function openPrintWindow(html, title = 'Qiwam ERP') {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert("Le navigateur a bloqué la fenêtre d'impression. Autorise les popups pour ce site.")
    return
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
${html}
</body>
</html>`)
  win.document.close()
  // Laisser le temps au navigateur de rendre le doc
  win.onload = () => { win.focus(); win.print() }
  // Fallback si onload ne se déclenche pas (doc synchrone)
  setTimeout(() => { try { win.focus(); win.print() } catch (_) {} }, 600)
}

// ─────────────────────────────────────────────────────────────────────────────
// FICHE RECETTE (BOM)
// ─────────────────────────────────────────────────────────────────────────────

export function printBom(bom, { computedTotalCost, computedUnitCost, sellingPrice, unitMargin, marginPct }) {
  const product = bom.product ?? {}

  const statusBadge = bom.is_active
    ? '<span class="badge badge-green">✓ Active</span>'
    : '<span class="badge badge-red">✗ Inactive</span>'

  const marginColor = marginPct >= 30 ? '#15803d' : marginPct >= 10 ? '#92400e' : '#b91c1c'
  const marginBadgeClass = marginPct >= 30 ? 'badge-green' : marginPct >= 10 ? 'badge-amber' : 'badge-red'

  const ingredientRows = (bom.items ?? []).map((item) => {
    const ing  = item.ingredient ?? item.material ?? {}
    const cost = Number(ing.cost_price) || 0
    const sub  = item.quantity * cost
    return `
      <tr>
        <td><strong>${ing.name ?? '—'}</strong>
            <br/><span style="color:#64748b;font-size:10px">${ing.type_label ?? ing.type ?? ''}</span></td>
        <td class="center">${item.quantity} ${ing.unit ?? ''}</td>
        <td class="right" style="color:#64748b">${fmt(cost)}</td>
        <td class="right"><strong>${fmt(sub)}</strong></td>
      </tr>`
  }).join('')

  const html = `
  <div class="header">
    <div>
      <div class="header-brand">Qiwam ERP</div>
      <div style="font-size:11px;color:#64748b">Fiche Recette (BOM)</div>
    </div>
    <div class="header-meta">
      Imprimée le ${today()}<br/>
      Ref. interne #${bom.id}
    </div>
  </div>

  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
    <div style="width:48px;height:48px;border-radius:12px;background:#eff6ff;
                display:flex;align-items:center;justify-content:center;font-size:22px"></div>
    <div>
      <h1>${product.name ?? '—'}</h1>
      <div style="display:flex;gap:8px;margin-top:4px">
        ${statusBadge}
        <span class="badge badge-blue">${bom.name || 'Recette standard'}</span>
      </div>
    </div>
  </div>

  <!-- Fiche technique -->
  <div class="card">
    <h2>FICHE TECHNIQUE</h2>
    <div class="grid-2">
      <div>
        <div class="info-row"><span class="info-label">Produit fini</span><span class="info-value">${product.name ?? '—'}</span></div>
        <div class="info-row"><span class="info-label">Quantité de base</span><span class="info-value">${bom.quantity} ${product.unit ?? 'u'}</span></div>
      </div>
      <div>
        <div class="info-row"><span class="info-label">Taux de perte</span><span class="info-value" style="color:#ef4444;font-weight:700">${bom.waste_percentage ?? 0}%</span></div>
        <div class="info-row"><span class="info-label">Coût de revient</span><span class="info-value" style="color:#3b82f6;font-weight:700">${fmt(computedTotalCost)}</span></div>
      </div>
    </div>
  </div>

  <!-- Ingrédients -->
  <div class="card">
    <h2>🧂 Ingrédients & Composants (${bom.items?.length ?? 0} éléments)</h2>
    <table>
      <thead>
        <tr>
          <th>Matière / Ingrédient</th>
          <th class="center">Quantité</th>
          <th class="right">Coût unitaire</th>
          <th class="right">Sous-total</th>
        </tr>
      </thead>
      <tbody>${ingredientRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="right" style="color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase">
            Total ingrédients${bom.waste_percentage > 0 ? ` (perte ${bom.waste_percentage}% incluse)` : ''}
          </td>
          <td class="right" style="color:#3b82f6">${fmt(computedTotalCost)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Rentabilité -->
  <div class="card">
    <h2>RENTABILITÉ</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value" style="color:#0f172a">${fmt(sellingPrice)}</div>
        <div class="stat-sub">/ ${product.unit ?? 'u'}</div>
        <div class="stat-label">Prix de vente cible</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:#ef4444">${fmt(computedUnitCost)}</div>
        <div class="stat-sub">/ ${product.unit ?? 'u'}</div>
        <div class="stat-label">Coût unitaire fabrication</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" style="color:${marginColor}">${fmt(unitMargin)}</div>
        <div class="stat-sub"><span class="badge ${marginBadgeClass}">${marginPct.toFixed(1)} %</span></div>
        <div class="stat-label">Marge brute</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Qiwam ERP — Document généré automatiquement</span>
    <span>${today()}</span>
  </div>`

  openPrintWindow(html, `Recette — ${product.name}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKET DE CAISSE (POS)
// ─────────────────────────────────────────────────────────────────────────────

const RECEIPT_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    color: #1e293b;
    background: #fff;
    display: flex;
    justify-content: center;
    padding: 24px 16px;
  }
  .receipt { width: 100%; max-width: 360px; }
  .receipt-header {
    text-align: center;
    border-bottom: 2px dashed #cbd5e1;
    padding-bottom: 16px;
    margin-bottom: 14px;
  }
  .brand { font-size: 24px; font-weight: 900; letter-spacing: 3px; color: #0f172a; }
  .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
  .meta-row {
    display: flex; justify-content: space-between;
    padding: 3px 0; font-size: 11px; color: #64748b;
  }
  .divider { border: none; border-top: 1px dashed #cbd5e1; margin: 12px 0; }
  .items-header {
    display: flex; font-size: 10px; font-weight: 700;
    color: #94a3b8; text-transform: uppercase;
    padding: 5px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 4px;
  }
  .col-name  { flex: 1; }
  .col-qty   { width: 36px; text-align: center; }
  .col-pu    { width: 88px; text-align: right; }
  .col-total { width: 96px; text-align: right; }
  .item-row {
    display: flex; align-items: flex-start;
    padding: 5px 0; font-size: 12px;
    border-bottom: 1px dotted #f1f5f9;
  }
  .item-row:last-child { border-bottom: none; }
  .total-section {
    border-top: 2px dashed #cbd5e1;
    padding-top: 12px; margin-top: 12px;
  }
  .total-row {
    display: flex; justify-content: space-between;
    padding: 3px 0; font-size: 12px;
  }
  .total-row .lbl { color: #64748b; }
  .total-final {
    display: flex; justify-content: space-between;
    font-size: 17px; font-weight: 900;
    padding: 8px 0;
    border-top: 2px solid #0f172a;
    border-bottom: 2px solid #0f172a;
    margin: 8px 0;
  }
  .payment-block { margin-top: 12px; }
  .payment-block .title {
    font-size: 10px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px;
  }
  .change-row {
    display: flex; justify-content: space-between;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 6px; padding: 8px 12px;
    font-weight: 700; font-size: 13px; color: #15803d;
    margin-top: 10px;
  }
  .ref-box {
    text-align: center; font-size: 11px; color: #64748b;
    padding: 8px; background: #f8fafc; border-radius: 4px;
    margin-top: 12px; letter-spacing: .5px;
  }
  .receipt-footer {
    text-align: center;
    border-top: 2px dashed #cbd5e1;
    padding-top: 14px; margin-top: 18px;
    font-size: 11px; color: #94a3b8; line-height: 1.8;
  }
  @media print {
    body { padding: 0; }
    @page { margin: 0.3cm; size: 80mm auto; }
  }
`

export function printReceipt(order, cart, customer, payments, total, change, tenant = null) {
  const now    = new Date()
  const dateStr = now.toLocaleDateString('fr-FR')
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const ref    = order?.reference
    ? order.reference
    : order?.id ? `N°${order.id}` : '—'

  const brandName = tenant?.name || 'Qiwam ERP'
  const address   = tenant?.settings?.address || ''
  const phone     = tenant?.settings?.phone   || ''
  const email     = tenant?.settings?.email   || ''

  const methodLabels = {
    cash: 'Espèces', wave: 'Wave',
    orange_money: 'Orange Money', card: 'Carte bancaire',
  }

  const itemsHtml = (cart ?? []).map(item => `
    <div class="item-row">
      <div class="col-name">${item.name}</div>
      <div class="col-qty">${item.quantity}</div>
      <div class="col-pu">${fmt(item.selling_price)}</div>
      <div class="col-total">${fmt(item.selling_price * item.quantity)}</div>
    </div>`).join('')

  const paymentsHtml = (payments ?? []).map(p => `
    <div class="total-row">
      <span class="lbl">${methodLabels[p.method] || p.method}${p.reference ? ` · ${p.reference}` : ''}</span>
      <span>${fmt(p.amount)}</span>
    </div>`).join('')

  const changeHtml = change > 0 ? `
    <div class="change-row">
      <span>Monnaie rendue</span>
      <span>${fmt(change)}</span>
    </div>` : ''

  const html = `
  <div class="receipt">
    <div class="receipt-header">
      <div class="brand">${brandName.toUpperCase()}</div>
      ${address ? `<div class="subtitle">${address}</div>` : ''}
      ${phone   ? `<div class="subtitle">Tél : ${phone}</div>` : ''}
      ${email   ? `<div class="subtitle">${email}</div>` : ''}
      <div class="subtitle" style="margin-top:6px">Reçu de vente</div>
    </div>

    <div class="meta-row"><span>Date</span><span>${dateStr} ${timeStr}</span></div>
    <div class="meta-row"><span>Reçu</span><span>${ref}</span></div>
    <div class="meta-row"><span>Client</span><span>${customer?.name || 'Client de passage'}</span></div>

    <hr class="divider"/>

    <div class="items-header">
      <span class="col-name">Article</span>
      <span class="col-qty">Qté</span>
      <span class="col-pu">P.U.</span>
      <span class="col-total">Total</span>
    </div>
    ${itemsHtml}

    <div class="total-section">
      <div class="total-row"><span class="lbl">Sous-total</span><span>${fmt(total)}</span></div>
      <div class="total-row"><span class="lbl">Remise</span><span>0 FCFA</span></div>
      <div class="total-final"><span>TOTAL</span><span>${fmt(total)}</span></div>

      <div class="payment-block">
        <div class="title">Règlement</div>
        ${paymentsHtml}
      </div>
      ${changeHtml}
    </div>

    <div class="ref-box">Réf : ${ref}</div>

    <div class="receipt-footer">
      <div>★ Merci pour votre achat ! ★</div>
      <div>${brandName} — ${dateStr}</div>
    </div>
  </div>`

  const win = window.open('', '_blank', 'width=520,height=720')
  if (!win) {
    alert("Le navigateur a bloqué la fenêtre d'impression. Autorise les popups pour ce site.")
    return
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Reçu ${ref}</title>
  <style>${RECEIPT_CSS}</style>
</head>
<body>${html}</body>
</html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
  setTimeout(() => { try { win.focus(); win.print() } catch (_) {} }, 600)
}

// ─────────────────────────────────────────────────────────────────────────────
// FICHE PRODUIT
// ─────────────────────────────────────────────────────────────────────────────

export function printProduct(product) {
  const isService  = product.type === 'service'
  const marginColor = product.margin >= 30 ? '#15803d' : product.margin >= 10 ? '#92400e' : '#b91c1c'
  const marginBadgeClass = product.margin >= 30 ? 'badge-green' : product.margin >= 10 ? 'badge-amber' : 'badge-red'

  const stockBadge = isService
    ? ''
    : product.stock_quantity <= 0
      ? '<span class="badge badge-red">⚠ Rupture de stock</span>'
      : product.is_low_stock
        ? '<span class="badge badge-amber">⚠ Stock bas</span>'
        : '<span class="badge badge-green">✓ Stock OK</span>'

  const activeStatusBadge = product.is_active
    ? '<span class="badge badge-green">✓ Actif</span>'
    : '<span class="badge" style="background:#f1f5f9;color:#64748b">Inactif</span>'

  const stockAlertBox = !isService && product.stock_quantity <= 0
    ? `<div class="alert-box alert-red">⛔ Rupture de stock — ce produit n'est plus disponible.</div>`
    : !isService && product.is_low_stock
      ? `<div class="alert-box alert-amber">⚠️ Stock en dessous du seuil d'alerte (${product.stock_alert} ${product.unit}). Pensez à réapprovisionner.</div>`
      : ''

  const stockSection = isService ? '' : `
  <div class="card">
    <h2>📦 Stock</h2>
    <div class="grid-2">
      <div>
        <div class="info-row"><span class="info-label">Stock disponible</span>
          <span class="info-value" style="color:${product.stock_quantity <= 0 ? '#b91c1c' : product.is_low_stock ? '#92400e' : '#15803d'};font-weight:700">
            ${product.stock_quantity} ${product.unit}
          </span>
        </div>
        <div class="info-row"><span class="info-label">Seuil d'alerte</span><span class="info-value">${product.stock_alert} ${product.unit}</span></div>
      </div>
    </div>
    ${stockAlertBox}
  </div>`

  const html = `
  <div class="header">
    <div>
      <div class="header-brand">Qiwam ERP</div>
      <div style="font-size:11px;color:#64748b">Fiche Produit</div>
    </div>
    <div class="header-meta">
      Imprimée le ${today()}<br/>
      Ref. interne #${product.id}
    </div>
  </div>

  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
    <div style="width:48px;height:48px;border-radius:12px;background:#eff6ff;
                display:flex;align-items:center;justify-content:center;font-size:22px">
      ${isService ? '⚡' : product.type === 'material' ? '🧱' : '📦'}
    </div>
    <div>
      <h1>${product.name}</h1>
      <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
        ${activeStatusBadge}
        ${stockBadge}
        ${product.sku ? `<span class="badge badge-blue">SKU: ${product.sku}</span>` : ''}
        <span class="badge" style="background:#f1f5f9;color:#475569">
          ${product.type === 'material' ? 'Matière première' : product.type === 'service' ? 'Service' : 'Produit'}
        </span>
      </div>
    </div>
  </div>

  <!-- Informations générales -->
  <div class="card">
    <h2>📋 Informations générales</h2>
    <div class="grid-2">
      <div>
        <div class="info-row"><span class="info-label">Nom</span><span class="info-value">${product.name}</span></div>
        <div class="info-row"><span class="info-label">Type</span><span class="info-value">${product.type_label ?? product.type}</span></div>
        <div class="info-row"><span class="info-label">Unité</span><span class="info-value">${product.unit}</span></div>
      </div>
      <div>
        ${product.sku ? `<div class="info-row"><span class="info-label">SKU</span><span class="info-value">${product.sku}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Catégorie</span><span class="info-value">${product.category_label || '—'}</span></div>
        <div class="info-row"><span class="info-label">Créé le</span><span class="info-value">${fmtDate(product.created_at)}</span></div>
      </div>
    </div>
    ${product.description ? `<p style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;font-size:12px;color:#475569">${product.description}</p>` : ''}
  </div>

  <!-- Tarifs & Marges -->
  <div class="card">
    <h2>💰 Tarifs & Rentabilité</h2>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-value" style="color:#0f172a">${fmt(product.selling_price)}</div>
        <div class="stat-sub">/ ${product.unit}</div>
        <div class="stat-label">Prix de vente</div>
      </div>
      ${!isService ? `
      <div class="stat-box">
        <div class="stat-value" style="color:#ef4444">${fmt(product.cost_price)}</div>
        <div class="stat-sub">/ ${product.unit}</div>
        <div class="stat-label">Prix de revient</div>
      </div>` : ''}
      <div class="stat-box">
        <div class="stat-value" style="color:${marginColor}">${product.margin ?? 0}%</div>
        <div class="stat-sub"><span class="badge ${marginBadgeClass}">${product.margin >= 30 ? 'Excellente' : product.margin >= 10 ? 'Correcte' : 'Faible'}</span></div>
        <div class="stat-label">Marge brute</div>
      </div>
    </div>
  </div>

  ${stockSection}

  <div class="footer">
    <span>Qiwam ERP — Document généré automatiquement</span>
    <span>${today()}</span>
  </div>`

  openPrintWindow(html, `Produit — ${product.name}`)
}
