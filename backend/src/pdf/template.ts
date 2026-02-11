import { Invoice, InvoiceItem } from '@prisma/client'

type InvoiceWithItems = Invoice & { items: InvoiceItem[]; client?: { name: string; nip?: string; address?: string } | null }

type Labels = {
  title: string
  number: string
  issueDate: string
  saleDate: string
  issuer: string
  buyer: string
  description: string
  quantity: string
  netPrice: string
  vat: string
  netValue: string
  grossValue: string
  netTotal: string
  vatTotal: string
  grossTotal: string
  notes: string
}

const labels: Record<string, Labels> = {
  pl: {
    title: 'Faktura',
    number: 'Numer',
    issueDate: 'Data wystawienia',
    saleDate: 'Data sprzedaży',
    issuer: 'Wystawca',
    buyer: 'Nabywca',
    description: 'Opis',
    quantity: 'Ilość',
    netPrice: 'Cena netto',
    vat: 'VAT',
    netValue: 'Wartość netto',
    grossValue: 'Wartość brutto',
    netTotal: 'Suma netto',
    vatTotal: 'VAT',
    grossTotal: 'Suma brutto',
    notes: 'Uwagi'
  },
  en: {
    title: 'Invoice',
    number: 'Number',
    issueDate: 'Issue date',
    saleDate: 'Sale date',
    issuer: 'Issuer',
    buyer: 'Buyer',
    description: 'Description',
    quantity: 'Qty',
    netPrice: 'Net price',
    vat: 'VAT',
    netValue: 'Net value',
    grossValue: 'Gross value',
    netTotal: 'Net total',
    vatTotal: 'VAT',
    grossTotal: 'Gross total',
    notes: 'Notes'
  }
}

const formatDate = (value: Date) => value.toISOString().slice(0, 10)

export const renderInvoiceHtml = (invoice: InvoiceWithItems, language = 'pl') => {
  const t = labels[language] ?? labels.pl
  const currency = invoice.currency

  const itemsRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.priceNet.toFixed(2)} ${currency}</td>
        <td>${item.vatRate}%</td>
        <td>${(Number(item.quantity) * Number(item.priceNet)).toFixed(2)} ${currency}</td>
        <td>${(Number(item.quantity) * Number(item.priceNet) * (1 + Number(item.vatRate) / 100)).toFixed(2)} ${currency}</td>
      </tr>
    `
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; }
    .header { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; }
    .section { margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; }
    .summary { margin-top: 12px; display: flex; justify-content: flex-end; }
    .summary table td { border: none; padding: 4px 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${t.title}</div>
      <div>${t.number}: <strong>${invoice.number}</strong></div>
      <div>${t.issueDate}: <strong>${formatDate(invoice.issueDate)}</strong></div>
      <div>${t.saleDate}: <strong>${formatDate(invoice.saleDate)}</strong></div>
    </div>
  </div>

  <div class="section">
    <strong>${t.issuer}</strong><br />
    ${invoice.issuerName}<br />
    ${invoice.issuerNip ?? ''}<br />
    ${invoice.issuerAddr ?? ''}
  </div>

  <div class="section">
    <strong>${t.buyer}</strong><br />
    ${invoice.client?.name ?? '—'}<br />
    ${invoice.client?.nip ?? ''}<br />
    ${invoice.client?.address ?? ''}
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>${t.description}</th>
          <th>${t.quantity}</th>
          <th>${t.netPrice}</th>
          <th>${t.vat}</th>
          <th>${t.netValue}</th>
          <th>${t.grossValue}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <div class="summary">
    <table>
      <tr><td>${t.netTotal}:</td><td><strong>${invoice.totalNet.toFixed(2)} ${currency}</strong></td></tr>
      <tr><td>${t.vatTotal}:</td><td><strong>${invoice.totalVat.toFixed(2)} ${currency}</strong></td></tr>
      <tr><td>${t.grossTotal}:</td><td><strong>${invoice.totalGross.toFixed(2)} ${currency}</strong></td></tr>
    </table>
  </div>

  ${invoice.notes ? `<div class="section"><strong>${t.notes}</strong><br />${invoice.notes}</div>` : ''}
</body>
</html>
  `
}
