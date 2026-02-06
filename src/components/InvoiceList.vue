<template>
  <div class="document-list">
    <header class="list-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Rejestr dokumentów</h1>
        <p>Wszystkie faktury, paragony, PZ i wydatki w jednym miejscu.</p>
      </div>
      <div class="header-actions">
        <input v-model.trim="query" placeholder="Szukaj po numerze lub kontrahencie..." />
        <button class="danger-btn" @click="deleteAll">Usuń wszystkie</button>
      </div>
    </header>

    <div class="filter-bar">
      <button :class="['chip', filter === 'all' && 'active']" @click="filter = 'all'">Wszystkie</button>
      <button :class="['chip', filter === 'sales' && 'active']" @click="filter = 'sales'">Sprzedaż</button>
      <button :class="['chip', filter === 'warehouse' && 'active']" @click="filter = 'warehouse'">Magazyn</button>
      <button :class="['chip', filter === 'expense' && 'active']" @click="filter = 'expense'">Wydatki</button>
    </div>

    <div class="table-card">
      <table v-if="filteredDocuments.length" class="document-table">
        <thead>
          <tr>
            <th>Typ</th>
            <th>Numer</th>
            <th>Kontrahent</th>
            <th>Data</th>
            <th>Termin</th>
            <th>Wartość</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id" :class="{ overdue: isOverdue(doc) }">
            <td>
              <span class="type-pill">{{ typeLabels[doc.type] }}</span>
            </td>
            <td>{{ doc.number }}</td>
            <td>{{ doc.counterparty?.name || '-' }}</td>
            <td>{{ formatDate(doc.document?.issueDate) }}</td>
            <td>{{ formatDate(doc.document?.dueDate) }}</td>
            <td>{{ doc.totals?.brutto }} {{ doc.currency }}</td>
            <td>
              <span class="status" :class="doc.document?.paymentStatus">
                {{ statusLabels[doc.document?.paymentStatus] || (isOverdue(doc) ? 'Po terminie' : '—') }}
              </span>
            </td>
            <td class="actions">
              <button class="ghost-btn" @click="viewDocument(doc)">Podgląd</button>
              <button class="danger-btn" @click="deleteDocument(doc.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <h3>Brak dokumentów</h3>
        <p>Dodaj pierwszy dokument, aby pojawił się w rejestrze.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { clearDocuments, getDocuments, removeDocument } from '@/services/documents'

const router = useRouter()
const documents = ref([])
const filter = ref('all')
const query = ref('')

const typeLabels = {
  invoice: 'Faktura VAT',
  proforma: 'Proforma',
  advance: 'Zaliczkowa',
  final: 'Końcowa',
  correction: 'Korekta',
  receipt: 'Paragon',
  pz: 'PZ',
  wz: 'WZ',
  rw: 'RW',
  mm: 'MM',
  inw: 'INW',
  so: 'Zamówienie sprzedaży',
  po: 'Zamówienie zakupu',
  rma: 'Zwrot/RMA',
  expense: 'Wydatek'
}

const statusLabels = {
  unpaid: 'Nieopłacona',
  paid: 'Opłacona'
}

const salesTypes = ['invoice', 'proforma', 'advance', 'final', 'correction', 'receipt']

const filteredDocuments = computed(() => {
  let base = documents.value
  if (filter.value === 'sales') base = base.filter((doc) => salesTypes.includes(doc.type))
  if (filter.value === 'warehouse') base = base.filter((doc) => ['pz', 'wz', 'rw', 'mm', 'inw'].includes(doc.type))
  if (filter.value === 'expense') base = base.filter((doc) => doc.type === 'expense')

  if (!query.value) return base
  const term = query.value.toLowerCase()
  return base.filter((doc) =>
    [doc.number, doc.counterparty?.name, doc.counterparty?.nip]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const today = () => new Date().toISOString().substring(0, 10)

const isOverdue = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return false
  if (!doc.document?.dueDate) return false
  return doc.document.dueDate < today()
}

const loadDocuments = () => {
  documents.value = getDocuments()
}

const deleteDocument = (id) => {
  documents.value = removeDocument(id)
}

const deleteAll = () => {
  documents.value = []
  clearDocuments()
}

const viewDocument = (doc) => {
  const data = encodeURIComponent(JSON.stringify(doc))
  router.push({ path: '/preview', query: { data } })
}

const goHome = () => {
  router.push({ name: 'home' })
}

const formatDate = (date) => {
  if (!date) return '-'
  const parsed = new Date(date)
  if (parsed.toString() === 'Invalid Date') return '-'
  return parsed.toLocaleDateString('pl-PL')
}

onMounted(loadDocuments)
</script>

<style src="./InvoiceList.css"></style>
