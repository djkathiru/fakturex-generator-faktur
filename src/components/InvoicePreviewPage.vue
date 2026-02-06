<template>
  <div class="invoice-preview-container">
    <div class="invoice-preview-header">
      <h1>Podgląd dokumentu</h1>
      <div class="invoice-preview-actions">
        <button @click="window.print()" class="btn-secondary">
          Drukuj
        </button>
        <button @click="downloadPDF" class="btn-primary">
          Pobierz jako PDF
        </button>
      </div>
    </div>

    <div
      id="pdf"
      class="invoice-document"
      :class="`layout-${template.layout}`"
      :style="{ '--accent': template.accentColor }"
    >
      <div class="invoice-header">
        <div>
          <h2>{{ typeLabel }}</h2>
          <p>{{ labels.number }}: <strong>{{ document.number }}</strong></p>
          <p>{{ labels.issueDate }}: <strong>{{ invoiceDate }}</strong></p>
          <p>{{ labels.saleDate }}: <strong>{{ saleDate }}</strong></p>
        </div>
        <div class="invoice-logo">
          <img v-if="template.logo" :src="template.logo" alt="Logo firmy" class="invoice-logo-img" />
        </div>
      </div>

      <div class="invoice-parties">
        <div>
          <h3>{{ labels.issuer }}</h3>
          <p>{{ issuer.name }}</p>
          <p>{{ issuer.nip }}</p>
          <p>{{ issuer.address }}</p>
        </div>
        <div>
          <h3>{{ counterpartyTitle }}</h3>
          <p>{{ counterparty.name }}</p>
          <p>{{ counterparty.nip }}</p>
          <p>{{ counterparty.address }}</p>
        </div>
      </div>

      <div v-if="document.relatedNumber" class="invoice-related">
        Powiązany dokument: <strong>{{ document.relatedNumber }}</strong>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>{{ labels.description }}</th>
            <th>{{ labels.quantity }}</th>
            <th>{{ labels.netPrice }}</th>
            <th>VAT</th>
            <th>{{ labels.netValue }}</th>
            <th>{{ labels.grossValue }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="index">
            <td>{{ item.description }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.price.toFixed(2) }} {{ currency }}</td>
            <td>{{ item.vat }}{{ item.vat === 'zw' ? '' : '%' }}</td>
            <td>{{ (item.quantity * item.price).toFixed(2) }} {{ currency }}</td>
            <td>{{ (item.quantity * item.price * (1 + vatToNumber(item.vat) / 100)).toFixed(2) }} {{ currency }}</td>
          </tr>
        </tbody>
      </table>

      <div class="invoice-summary">
        <table>
          <tr>
            <td>{{ labels.netTotal }}:</td>
            <td>{{ totalNetto }} {{ currency }}</td>
          </tr>
          <tr>
            <td>VAT:</td>
            <td>{{ totalVat }} {{ currency }}</td>
          </tr>
          <tr class="total">
            <td>{{ labels.grossTotal }}:</td>
            <td>{{ totalBrutto }} {{ currency }}</td>
          </tr>
        </table>
      </div>

      <div v-if="showPaymentInfo" class="invoice-payment">
        <h3>{{ labels.paymentInfo }}</h3>
        <p>{{ labels.dueDate }}: {{ dueDate }}</p>
        <p>{{ labels.paymentMethod }}: {{ document.paymentMethod }}</p>
        <p>{{ labels.bankAccount }}: {{ settings.payment.bankAccount || '—' }}</p>
        <p>{{ labels.bankName }}: {{ settings.payment.bankName || '—' }}</p>
      </div>

      <div v-if="document.notes" class="invoice-notes">
        <h3>{{ labels.notes }}</h3>
        <p>{{ document.notes }}</p>
      </div>

      <div v-if="template.terms" class="invoice-notes">
        <h3>{{ labels.terms }}</h3>
        <p>{{ template.terms }}</p>
      </div>

      <div class="invoice-footer">
        <p>{{ template.footerNote }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getSettings } from '@/services/settings'

const route = useRoute()

const issuer = ref({})
const counterparty = ref({})
const document = ref({})
const items = ref([])
const currency = ref('PLN')
const settings = ref(getSettings())
const template = computed(() => settings.value.template)
const language = computed(() => document.value.language || template.value.language || 'pl')
let filename = 'dokument.pdf'

if (route.query.data) {
  try {
    const parsed = JSON.parse(decodeURIComponent(route.query.data))
    issuer.value = parsed.issuer || {}
    counterparty.value = parsed.counterparty || parsed.client || {}
    document.value = parsed.document || parsed.invoice || {}
    items.value = parsed.items || []
    currency.value = parsed.currency || 'PLN'
    filename = parsed.filename || filename
  } catch (error) {
    console.error('Błąd podczas dekodowania danych faktury:', error)
  }
}

// Formatowanie daty
const invoiceDate = computed(() => {
  if (document.value.issueDate) {
    const parsedDate = new Date(document.value.issueDate)
    return isNaN(parsedDate) ? 'Data nieprawidłowa' : parsedDate.toLocaleDateString('pl-PL')
  }
  return 'Brak daty'
})

const saleDate = computed(() => {
  if (document.value.saleDate) {
    const parsedDate = new Date(document.value.saleDate)
    return isNaN(parsedDate) ? 'Data nieprawidłowa' : parsedDate.toLocaleDateString('pl-PL')
  }
  return 'Brak daty'
})

const vatToNumber = (vat) => {
  if (vat === 'zw') return 0
  const parsed = parseFloat(String(vat))
  return Number.isNaN(parsed) ? 0 : parsed
}

const totalNetto = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)
)

const totalVat = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity * item.price * (vatToNumber(item.vat) / 100), 0).toFixed(2)
)

const totalBrutto = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity * item.price * (1 + vatToNumber(item.vat) / 100), 0).toFixed(2)
)

const typeLabel = computed(() => {
  const labels = {
    invoice: 'Faktura VAT',
    proforma: 'Proforma',
    advance: 'Faktura zaliczkowa',
    final: 'Faktura końcowa',
    correction: 'Korekta',
    receipt: 'Paragon',
    pz: 'PZ (przyjęcie zewnętrzne)',
    wz: 'WZ (wydanie zewnętrzne)',
    rw: 'RW (rozchód wewnętrzny)',
    mm: 'MM (przesunięcie)',
    inw: 'INW (inwentaryzacja)',
    so: 'Zamówienie sprzedaży',
    po: 'Zamówienie zakupu',
    rma: 'Zwrot/RMA',
    expense: 'Wydatek'
  }
  return labels[document.value.type] || 'Dokument'
})

const labels = computed(() => {
  const translations = {
    pl: {
      number: 'Numer',
      issueDate: 'Data wystawienia',
      saleDate: 'Data sprzedaży',
      issuer: 'Wystawca',
      description: 'Opis',
      quantity: 'Ilość',
      netPrice: 'Cena netto',
      netValue: 'Wartość netto',
      grossValue: 'Wartość brutto',
      netTotal: 'Suma netto',
      grossTotal: 'Suma brutto',
      paymentInfo: 'Informacje o płatności',
      dueDate: 'Termin',
      paymentMethod: 'Metoda',
      bankAccount: 'Rachunek',
      bankName: 'Bank',
      notes: 'Uwagi',
      terms: 'Warunki sprzedaży'
    },
    en: {
      number: 'Number',
      issueDate: 'Issue date',
      saleDate: 'Sale date',
      issuer: 'Issuer',
      description: 'Description',
      quantity: 'Qty',
      netPrice: 'Net price',
      netValue: 'Net value',
      grossValue: 'Gross value',
      netTotal: 'Net total',
      grossTotal: 'Gross total',
      paymentInfo: 'Payment information',
      dueDate: 'Due date',
      paymentMethod: 'Method',
      bankAccount: 'Account',
      bankName: 'Bank',
      notes: 'Notes',
      terms: 'Terms'
    }
  }
  return translations[language.value] || translations.pl
})

const counterpartyTitle = computed(() => {
  const isEn = language.value === 'en'
  if (document.value.type === 'pz') return isEn ? 'Supplier' : 'Dostawca'
  if (document.value.type === 'wz') return isEn ? 'Recipient' : 'Odbiorca'
  if (document.value.type === 'rw') return isEn ? 'Internal issue' : 'Rozchód'
  if (document.value.type === 'mm') return isEn ? 'Transfer' : 'Przesunięcie'
  if (document.value.type === 'inw') return isEn ? 'Inventory' : 'Inwentaryzacja'
  if (document.value.type === 'expense') return isEn ? 'Counterparty' : 'Kontrahent'
  return isEn ? 'Buyer' : 'Nabywca'
})

const showPaymentInfo = computed(() =>
  settings.value.template.showPaymentInfo &&
  ['invoice', 'proforma', 'advance', 'final', 'correction'].includes(document.value.type)
)

const dueDate = computed(() => {
  if (!document.value.dueDate) return '—'
  const parsed = new Date(document.value.dueDate)
  return isNaN(parsed) ? '—' : parsed.toLocaleDateString('pl-PL')
})

const downloadPDF = async () => {
  const element = document.getElementById('pdf')
  const canvas = await html2canvas(element, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(filename)
}
</script>

<style src="./InvoicePreview.css"></style>
