<template>
  <div class="payments-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Płatności i windykacja</h1>
        <p>Monitoruj zaległości i ustawiaj przypomnienia.</p>
      </div>
      <div class="header-actions">
        <input v-model.trim="query" placeholder="Szukaj po numerze lub kontrahencie..." />
        <button class="primary-btn" @click="refresh">Odśwież</button>
      </div>
    </header>

    <section class="card">
      <div class="filter-bar">
        <button :class="['chip', filter === 'all' && 'active']" @click="filter = 'all'">Wszystkie</button>
        <button :class="['chip', filter === 'unpaid' && 'active']" @click="filter = 'unpaid'">Nieopłacone</button>
        <button :class="['chip', filter === 'overdue' && 'active']" @click="filter = 'overdue'">Po terminie</button>
        <button :class="['chip', filter === 'paid' && 'active']" @click="filter = 'paid'">Opłacone</button>
      </div>

      <table v-if="filteredDocuments.length" class="payments-table">
        <thead>
          <tr>
            <th>Dokument</th>
            <th>Kontrahent</th>
            <th>Termin</th>
            <th>Kwota</th>
            <th>Status</th>
            <th>Przypomnienie</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filteredDocuments" :key="doc.id">
            <td>
              <div class="doc-number">{{ doc.number }}</div>
              <div class="doc-type">{{ typeLabels[doc.type] }}</div>
            </td>
            <td>{{ doc.counterparty?.name || '-' }}</td>
            <td>{{ formatDate(doc.document?.dueDate) }}</td>
            <td>{{ doc.totals?.brutto }} {{ doc.currency }}</td>
            <td>
              <span class="status" :class="doc.document?.paymentStatus">
                {{ statusLabels[doc.document?.paymentStatus] || '—' }}
              </span>
            </td>
            <td>
              <div class="reminder">
                <input
                  type="date"
                  :value="doc.document?.reminderDate || ''"
                  @change="updateReminder(doc, $event.target.value)"
                />
                <input
                  type="text"
                  placeholder="Notatka"
                  :value="doc.document?.reminderNote || ''"
                  @change="updateReminderNote(doc, $event.target.value)"
                />
              </div>
            </td>
            <td class="actions">
              <button class="ghost-btn" @click="togglePaid(doc)">
                {{ doc.document?.paymentStatus === 'paid' ? 'Oznacz nieopł.' : 'Oznacz opł.' }}
              </button>
              <button class="danger-btn" @click="openPreview(doc)">Podgląd</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <h3>Brak płatności</h3>
        <p>Wszystkie dokumenty są opłacone lub nie mają terminu.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDocuments, updateDocument } from '@/services/documents'

const router = useRouter()
const documents = ref([])
const filter = ref('all')
const query = ref('')

const typeLabels = {
  invoice: 'Faktura VAT',
  proforma: 'Proforma',
  advance: 'Zaliczkowa',
  final: 'Końcowa',
  correction: 'Korekta'
}

const statusLabels = {
  unpaid: 'Nieopłacona',
  paid: 'Opłacona'
}

const salesTypes = ['invoice', 'proforma', 'advance', 'final', 'correction']

const loadDocuments = () => {
  documents.value = getDocuments().filter((doc) => salesTypes.includes(doc.type))
}

const refresh = () => {
  loadDocuments()
}

const today = () => new Date().toISOString().substring(0, 10)

const isOverdue = (doc) => {
  if (doc.document?.paymentStatus === 'paid') return false
  if (!doc.document?.dueDate) return false
  return doc.document.dueDate < today()
}

const filteredDocuments = computed(() => {
  let base = documents.value
  if (filter.value === 'paid') base = base.filter((doc) => doc.document?.paymentStatus === 'paid')
  if (filter.value === 'unpaid') base = base.filter((doc) => doc.document?.paymentStatus !== 'paid')
  if (filter.value === 'overdue') base = base.filter(isOverdue)

  if (!query.value) return base
  const term = query.value.toLowerCase()
  return base.filter((doc) =>
    [doc.number, doc.counterparty?.name, doc.counterparty?.nip]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const togglePaid = (doc) => {
  const nextStatus = doc.document?.paymentStatus === 'paid' ? 'unpaid' : 'paid'
  documents.value = updateDocument(doc.id, { document: { paymentStatus: nextStatus } })
}

const updateReminder = (doc, value) => {
  documents.value = updateDocument(doc.id, { document: { reminderDate: value } })
}

const updateReminderNote = (doc, value) => {
  documents.value = updateDocument(doc.id, { document: { reminderNote: value } })
}

const openPreview = (doc) => {
  const data = encodeURIComponent(JSON.stringify(doc))
  router.push({ path: '/preview', query: { data } })
}

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (parsed.toString() === 'Invalid Date') return '-'
  return parsed.toLocaleDateString('pl-PL')
}

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(loadDocuments)
</script>

<style src="./Payments.css"></style>
