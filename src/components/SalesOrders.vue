<template>
  <div class="orders-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Zamówienia sprzedaży</h1>
        <p>Twórz i realizuj zamówienia klientów.</p>
      </div>
      <button class="primary-btn" @click="toggleForm">
        {{ showForm ? 'Zamknij' : 'Nowe zamówienie' }}
      </button>
    </header>

    <section v-if="showForm" class="card">
      <h2>{{ editingId ? 'Edytuj zamówienie' : 'Nowe zamówienie' }}</h2>
      <div class="form-grid">
        <label>
          Kontrahent
          <select v-model="form.contactId">
            <option value="">Wybierz</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
              {{ contact.name }}
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
          Termin realizacji
          <input v-model="form.dueDate" type="date" />
        </label>
      </div>

      <div class="form-grid">
        <label>
          Produkt
          <select v-model="itemForm.itemId">
            <option value="">Wybierz produkt</option>
            <option v-for="item in availableItems" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.stock }} {{ item.unit }})
            </option>
          </select>
        </label>
        <label>
          Ilość
          <input v-model.number="itemForm.quantity" type="number" min="1" />
        </label>
      </div>
      <button class="ghost-btn" @click="addItem">Dodaj pozycję</button>

      <table v-if="form.items.length" class="orders-table">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Ilość</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in form.items" :key="index">
            <td>{{ itemName(item.itemId) }}</td>
            <td>{{ item.quantity }}</td>
            <td class="actions">
              <button class="danger-btn" @click="removeItem(index)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="form-actions">
        <button class="ghost-btn" @click="resetForm">Wyczyść</button>
        <button class="primary-btn" @click="saveOrder">Zapisz</button>
      </div>
    </section>

    <section class="card">
      <h2>Lista zamówień</h2>
      <table v-if="orders.length" class="orders-table">
        <thead>
          <tr>
            <th>Kontrahent</th>
            <th>Magazyn</th>
            <th>Pozycji</th>
            <th>Termin</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ contactName(order.contactId) }}</td>
            <td>{{ warehouseName(order.warehouseId) }}</td>
            <td>{{ order.items?.length || 0 }}</td>
            <td>{{ order.dueDate || '-' }}</td>
            <td>{{ statusLabels[order.status] }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="createPicking(order)">Picking</button>
              <button class="ghost-btn" @click="fulfillOrder(order)">Realizuj</button>
              <button class="danger-btn" @click="deleteOrder(order.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak zamówień</h3>
        <p>Dodaj pierwsze zamówienie sprzedaży.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addSalesOrder, getSalesOrders, removeSalesOrder, updateSalesOrder } from '@/services/salesOrders'
import { getContacts } from '@/services/contacts'
import { getWarehouses } from '@/services/warehouses'
import { getInventory, adjustInventoryStock } from '@/services/inventory'
import { addDocument, commitNumber } from '@/services/documents'
import { getSettings } from '@/services/settings'
import { addPickingTask } from '@/services/picking'

const router = useRouter()
const settings = getSettings()

const orders = ref([])
const contacts = ref([])
const warehouses = ref([])
const inventory = ref([])
const showForm = ref(false)
const editingId = ref('')

const form = ref({
  contactId: '',
  warehouseId: '',
  dueDate: '',
  items: []
})

const itemForm = ref({
  itemId: '',
  quantity: 1
})

const statusLabels = {
  draft: 'Szkic',
  confirmed: 'Potwierdzone',
  fulfilled: 'Zrealizowane'
}

const availableItems = computed(() => {
  if (!form.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === form.value.warehouseId)
})

const loadData = () => {
  orders.value = getSalesOrders()
  contacts.value = getContacts()
  warehouses.value = getWarehouses()
  inventory.value = getInventory()
  if (!form.value.warehouseId && warehouses.value.length) {
    form.value.warehouseId = warehouses.value[0].id
  }
}

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
}

const addItem = () => {
  if (!itemForm.value.itemId || !itemForm.value.quantity) return
  form.value.items.push({ ...itemForm.value })
  itemForm.value = { itemId: '', quantity: 1 }
}

const removeItem = (index) => {
  form.value.items.splice(index, 1)
}

const saveOrder = () => {
  if (!form.value.contactId || !form.value.items.length) return
  if (editingId.value) {
    orders.value = updateSalesOrder(editingId.value, { ...form.value })
  } else {
    orders.value = addSalesOrder({ ...form.value })
    const number = commitNumber('so', new Date(), settings)
    addDocument({
      id: crypto.randomUUID(),
      type: 'so',
      number,
      issuer: {
        name: settings.company.name,
        nip: settings.company.nip,
        address: settings.company.address
      },
      counterparty: contacts.value.find((entry) => entry.id === form.value.contactId) || { name: '—' },
      document: {
        type: 'so',
        number,
        issueDate: new Date().toISOString().substring(0, 10),
        saleDate: new Date().toISOString().substring(0, 10)
      },
      items: form.value.items,
      currency: settings.tax.defaultCurrency,
      totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
    })
  }
  resetForm()
  showForm.value = false
}

const deleteOrder = (id) => {
  orders.value = removeSalesOrder(id)
}

const fulfillOrder = (order) => {
  if (order.status === 'fulfilled') return
  order.items.forEach((item) => {
    adjustInventoryStock(item.itemId, -Number(item.quantity))
  })

  const number = commitNumber('wz', new Date(), settings)
  addDocument({
    id: crypto.randomUUID(),
    type: 'wz',
    number,
    issuer: {
      name: settings.company.name,
      nip: settings.company.nip,
      address: settings.company.address
    },
    counterparty: contacts.value.find((entry) => entry.id === order.contactId) || { name: '—' },
    document: {
      type: 'wz',
      number,
      issueDate: new Date().toISOString().substring(0, 10),
      saleDate: new Date().toISOString().substring(0, 10)
    },
    items: order.items.map((item) => {
      const entry = inventory.value.find((inv) => inv.id === item.itemId)
      return {
        description: entry?.name || 'Produkt',
        quantity: item.quantity,
        price: entry?.price || 0,
        vat: entry?.vat || '23'
      }
    }),
    currency: settings.tax.defaultCurrency,
    totals: { netto: '0.00', vat: '0.00', brutto: '0.00' }
  })

  orders.value = updateSalesOrder(order.id, { status: 'fulfilled' })
}

const createPicking = (order) => {
  addPickingTask({
    orderId: order.id,
    items: order.items,
    warehouseId: order.warehouseId,
    contactId: order.contactId
  })
}

const itemName = (id) => inventory.value.find((item) => item.id === id)?.name || '-'
const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'

const resetForm = () => {
  editingId.value = ''
  form.value = { contactId: '', warehouseId: warehouses.value[0]?.id || '', dueDate: '', items: [] }
  itemForm.value = { itemId: '', quantity: 1 }
}

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(loadData)
</script>

<style src="./Orders.css"></style>
