<template>
  <div class="reports-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Raporty i eksport</h1>
        <p>Podsumowanie sprzedaży, VAT oraz eksport CSV.</p>
      </div>
      <button class="primary-btn" @click="refresh">Odśwież</button>
    </header>

    <section class="card">
      <h2>Zakres dat</h2>
      <div class="form-grid">
        <label>
          Od
          <input v-model="range.from" type="date" />
        </label>
        <label>
          Do
          <input v-model="range.to" type="date" />
        </label>
        <label>
          Typ dokumentu
          <select v-model="filterType">
            <option value="all">Wszystkie</option>
            <option v-for="type in salesTypes" :key="type" :value="type">
              {{ typeLabels[type] }}
            </option>
          </select>
        </label>
        <label>
          Waluta
          <select v-model="filterCurrency">
            <option value="all">Wszystkie</option>
            <option v-for="currency in currencies" :key="currency" :value="currency">
              {{ currency }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card">
        <p>Suma netto</p>
        <strong>{{ totals.netto }} {{ activeCurrency }}</strong>
      </div>
      <div class="summary-card">
        <p>VAT</p>
        <strong>{{ totals.vat }} {{ activeCurrency }}</strong>
      </div>
      <div class="summary-card">
        <p>Suma brutto</p>
        <strong>{{ totals.brutto }} {{ activeCurrency }}</strong>
      </div>
    </section>

    <section class="card">
      <div class="table-header">
        <h2>Dokumenty w okresie</h2>
        <div class="actions">
          <button class="ghost-btn" @click="exportDocuments">Eksport CSV</button>
          <button v-if="canExportExcel" class="ghost-btn" @click="exportExcel">Eksport Excel</button>
          <button class="primary-btn" @click="exportVatSummary">Eksport VAT CSV</button>
        </div>
      </div>

      <table v-if="filteredDocuments.length" class="reports-table">
        <thead>
          <tr>
            <th>Numer</th>
            <th>Typ</th>
            <th>Kontrahent</th>
            <th>Data</th>
            <th>Netto</th>
            <th>VAT</th>
            <th>Brutto</th>
            <th>Waluta</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>{{ doc.number }}</td>
            <td>{{ typeLabels[doc.type] }}</td>
            <td>{{ doc.counterparty?.name || '-' }}</td>
            <td>{{ formatDate(doc.document?.issueDate) }}</td>
            <td>{{ getTotals(doc).netto }}</td>
            <td>{{ getTotals(doc).vat }}</td>
            <td>{{ getTotals(doc).brutto }}</td>
            <td>{{ doc.currency }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <h3>Brak danych</h3>
        <p>W wybranym okresie nie ma dokumentów sprzedaży.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDocuments } from '@/services/documents'
import { getSettings } from '@/services/settings'
import { exportCsv } from '@/services/csv'
import { apiUrl, getAuthHeaders, hasBackendConfig } from '@/services/api'

const router = useRouter()
const settings = ref(getSettings())
const documents = ref([])

const typeLabels = {
  invoice: 'Faktura VAT',
  proforma: 'Proforma',
  advance: 'Zaliczkowa',
  final: 'Końcowa',
  correction: 'Korekta',
  receipt: 'Paragon'
}

const salesTypes = ['invoice', 'proforma', 'advance', 'final', 'correction', 'receipt']
const currencies = computed(() => settings.value.tax.enabledCurrencies)

const filterType = ref('all')
const filterCurrency = ref('all')

const range = ref({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
  to: new Date().toISOString().substring(0, 10)
})

const normalize = (date) => (date ? new Date(date).toISOString().substring(0, 10) : '')

const inRange = (date) => {
  if (!date) return false
  const current = normalize(date)
  if (range.value.from && current < range.value.from) return false
  if (range.value.to && current > range.value.to) return false
  return true
}

const filteredDocuments = computed(() => {
  return documents.value
    .filter((doc) => salesTypes.includes(doc.type))
    .filter((doc) => inRange(doc.document?.issueDate))
    .filter((doc) => (filterType.value === 'all' ? true : doc.type === filterType.value))
    .filter((doc) => (filterCurrency.value === 'all' ? true : doc.currency === filterCurrency.value))
})

const getTotals = (doc) => {
  const totals = doc.totals || {}
  return {
    netto: totals.netto || '0.00',
    vat: totals.vat || '0.00',
    brutto: totals.brutto || '0.00'
  }
}

const totals = computed(() => {
  const sums = filteredDocuments.value.reduce(
    (acc, doc) => {
      const t = getTotals(doc)
      acc.netto += Number(t.netto)
      acc.vat += Number(t.vat)
      acc.brutto += Number(t.brutto)
      return acc
    },
    { netto: 0, vat: 0, brutto: 0 }
  )

  return {
    netto: sums.netto.toFixed(2),
    vat: sums.vat.toFixed(2),
    brutto: sums.brutto.toFixed(2)
  }
})

const activeCurrency = computed(() => (filterCurrency.value === 'all' ? settings.value.tax.defaultCurrency : filterCurrency.value))
const canExportExcel = computed(() => hasBackendConfig())

const exportDocuments = () => {
  if (hasBackendConfig()) {
    const params = new URLSearchParams({
      from: range.value.from,
      to: range.value.to
    })
    const url = apiUrl(`/reports/export/csv?${params.toString()}`)
    fetch(url, { headers: getAuthHeaders() })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'raport-dokumenty.csv'
        link.click()
        URL.revokeObjectURL(link.href)
      })
    return
  }
  const rows = [
    ['Numer', 'Typ', 'Kontrahent', 'Data', 'Netto', 'VAT', 'Brutto', 'Waluta']
  ]

  filteredDocuments.value.forEach((doc) => {
    const t = getTotals(doc)
    rows.push([
      doc.number,
      typeLabels[doc.type] || doc.type,
      doc.counterparty?.name || '-',
      formatDate(doc.document?.issueDate),
      t.netto,
      t.vat,
      t.brutto,
      doc.currency
    ])
  })

  exportCsv(rows, 'raport-dokumenty.csv')
}

const exportExcel = () => {
  if (!hasBackendConfig()) return
  const params = new URLSearchParams({
    from: range.value.from,
    to: range.value.to
  })
  const url = apiUrl(`/reports/export/xlsx?${params.toString()}`)
  fetch(url, { headers: getAuthHeaders() })
    .then((res) => res.blob())
    .then((blob) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'raport-dokumenty.xlsx'
      link.click()
      URL.revokeObjectURL(link.href)
    })
}

const exportVatSummary = () => {
  const rows = [
    ['Typ', 'Netto', 'VAT', 'Brutto', 'Waluta']
  ]

  const summary = filteredDocuments.value.reduce((acc, doc) => {
    const key = `${doc.type}-${doc.currency}`
    if (!acc[key]) acc[key] = { type: doc.type, currency: doc.currency, netto: 0, vat: 0, brutto: 0 }
    const t = getTotals(doc)
    acc[key].netto += Number(t.netto)
    acc[key].vat += Number(t.vat)
    acc[key].brutto += Number(t.brutto)
    return acc
  }, {})

  Object.values(summary).forEach((row) => {
    rows.push([
      typeLabels[row.type] || row.type,
      row.netto.toFixed(2),
      row.vat.toFixed(2),
      row.brutto.toFixed(2),
      row.currency
    ])
  })

  exportCsv(rows, 'raport-vat.csv')
}

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (parsed.toString() === 'Invalid Date') return '-'
  return parsed.toLocaleDateString('pl-PL')
}

const refresh = () => {
  documents.value = getDocuments()
}

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(refresh)
</script>

<style src="./Reports.css"></style>
