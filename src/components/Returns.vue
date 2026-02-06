<template>
  <div class="orders-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Zwroty i reklamacje</h1>
        <p>Rejestr zwrotów, reklamacji i przyjęć na magazyn.</p>
      </div>
      <button class="primary-btn" @click="toggleForm">
        {{ showForm ? 'Zamknij' : 'Nowy zwrot' }}
      </button>
    </header>

    <section v-if="showForm" class="card">
      <h2>Nowy zwrot</h2>
      <div class="form-grid">
        <label>
          Dokument źródłowy
          <select v-model="form.documentId">
            <option value="">Wybierz dokument</option>
            <option v-for="doc in salesDocs" :key="doc.id" :value="doc.id">
              {{ doc.number }}
            </option>
          </select>
        </label>
        <label>
          Magazyn
          <select v-model="form.warehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>
          Produkt
          <select v-model="form.itemId">
            <option value="">Wybierz produkt</option>
            <option v-for="item in inventory" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label>
          Ilość
          <input v-model.number="form.quantity" type="number" min="1" />
        </label>
        <label>
          Przywrócić na magazyn
          <select v-model="form.returnToStock">
            <option :value="true">Tak</option>
            <option :value="false">Nie</option>
          </select>
        </label>
      </div>
      <button class="primary-btn" @click="saveReturn">Zapisz zwrot</button>
    </section>

    <section class="card">
      <h2>Lista zwrotów</h2>
      <table v-if="returnsList.length" class="orders-table">
        <thead>
          <tr>
            <th>Dokument</th>
            <th>Produkt</th>
            <th>Ilość</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in returnsList" :key="entry.id">
            <td>{{ docNumber(entry.documentId) }}</td>
            <td>{{ itemName(entry.itemId) }}</td>
            <td>{{ entry.quantity }}</td>
            <td>{{ entry.status === 'open' ? 'Otwarte' : 'Zamknięte' }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="closeReturn(entry)">Zamknij</button>
              <button class="danger-btn" @click="deleteReturn(entry.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak zwrotów</h3>
        <p>Dodaj pierwszy zwrot.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addReturn, getReturns, removeReturn, updateReturn } from '@/services/returns'
import { getDocuments, addDocument, commitNumber } from '@/services/documents'
import { getInventory, adjustInventoryStock } from '@/services/inventory'
import { getWarehouses } from '@/services/warehouses'
import { getSettings } from '@/services/settings'

const router = useRouter()
const settings = getSettings()

const returnsList = ref([])
const salesDocs = ref([])
const inventory = ref([])
const warehouses = ref([])
const showForm = ref(false)

const form = ref({
  documentId: '',
  warehouseId: '',
  itemId: '',
  quantity: 1,
  returnToStock: true
})

const loadData = () => {
  returnsList.value = getReturns()
  salesDocs.value = getDocuments().filter((doc) => ['invoice', 'final', 'receipt'].includes(doc.type))
  inventory.value = getInventory()
  warehouses.value = getWarehouses()
  if (!form.value.warehouseId && warehouses.value.length) {
    form.value.warehouseId = warehouses.value[0].id
  }
}

const toggleForm = () => {
  showForm.value = !showForm.value
}

const saveReturn = () => {
  if (!form.value.itemId || !form.value.quantity) return
  returnsList.value = addReturn({ ...form.value })

  const rmaNumber = commitNumber('rma', new Date(), settings)
  addDocument({
    id: crypto.randomUUID(),
    type: 'rma',
    number: rmaNumber,
    issuer: {
      name: settings.company.name,
      nip: settings.company.nip,
      address: settings.company.address
    },
    counterparty: { name: 'Zwrot' },
    document: {
      type: 'rma',
      number: rmaNumber,
      issueDate: new Date().toISOString().substring(0, 10),
      saleDate: new Date().toISOString().substring(0, 10)
    },
    items: [],
    currency: settings.tax.defaultCurrency,
    totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
  })

  if (form.value.returnToStock) {
    adjustInventoryStock(form.value.itemId, Number(form.value.quantity))
    const number = commitNumber('pz', new Date(), settings)
    addDocument({
      id: crypto.randomUUID(),
      type: 'pz',
      number,
      issuer: {
        name: settings.company.name,
        nip: settings.company.nip,
        address: settings.company.address
      },
      counterparty: { name: 'Zwrot' },
      document: {
        type: 'pz',
        number,
        issueDate: new Date().toISOString().substring(0, 10),
        saleDate: new Date().toISOString().substring(0, 10)
      },
      items: [],
      currency: settings.tax.defaultCurrency,
      totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
    })
  }

  form.value = {
    documentId: '',
    warehouseId: warehouses.value[0]?.id || '',
    itemId: '',
    quantity: 1,
    returnToStock: true
  }
}

const closeReturn = (entry) => {
  returnsList.value = updateReturn(entry.id, { status: 'closed' })
}

const deleteReturn = (id) => {
  returnsList.value = removeReturn(id)
}

const docNumber = (id) => salesDocs.value.find((doc) => doc.id === id)?.number || '-'
const itemName = (id) => inventory.value.find((item) => item.id === id)?.name || '-'

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(loadData)
</script>

<style src="./Orders.css"></style>
