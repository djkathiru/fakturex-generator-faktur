<template>
  <div class="warehouse-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Magazyn</h1>
        <p>Zarządzaj stanami i dokumentami magazynowymi.</p>
      </div>
      <div class="header-actions">
        <input ref="fileInput" type="file" accept=".csv" hidden @change="handleImport" />
        <button class="ghost-btn" @click="exportInventory">Eksport CSV</button>
        <button class="ghost-btn" @click="triggerImport">Import CSV</button>
        <button class="primary-btn" @click="toggleItemForm">
          {{ showItemForm ? 'Zamknij' : 'Dodaj towar' }}
        </button>
      </div>
    </header>

    <section class="card" v-if="showItemForm">
      <h2>{{ editingId ? 'Edytuj towar' : 'Nowy towar' }}</h2>
      <div class="form-grid">
        <label>
          Nazwa *
          <input v-model.trim="itemForm.name" type="text" />
        </label>
        <label>
          SKU
          <input v-model.trim="itemForm.sku" type="text" />
        </label>
        <label>
          Jednostka
          <input v-model.trim="itemForm.unit" type="text" />
        </label>
        <label>
          Cena netto
          <input v-model.number="itemForm.price" type="number" step="0.01" min="0" />
        </label>
        <label>
          VAT
          <select v-model="itemForm.vat">
            <option v-for="rate in vatRates" :key="rate" :value="rate">
              {{ rate === 'zw' ? 'zw' : rate + '%' }}
            </option>
          </select>
        </label>
        <label>
          Magazyn
          <select v-model="itemForm.warehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>
          Lokalizacja
          <input v-model.trim="itemForm.location" type="text" />
        </label>
        <label>
          Stan początkowy
          <input v-model.number="itemForm.stock" type="number" step="1" min="0" />
        </label>
        <label>
          Stan minimalny
          <input v-model.number="itemForm.minStock" type="number" step="1" min="0" />
        </label>
      </div>
      <div class="form-actions">
        <button class="ghost-btn" @click="resetItemForm">Wyczyść</button>
        <button class="primary-btn" @click="saveItem">
          {{ editingId ? 'Zapisz' : 'Dodaj' }}
        </button>
      </div>
    </section>

    <section class="card">
      <h2>Dokument magazynowy</h2>
      <div class="form-grid">
        <label>
          Typ dokumentu
          <select v-model="movement.type">
            <option value="pz">PZ (przyjęcie)</option>
            <option value="wz">WZ (wydanie)</option>
            <option value="rw">RW (rozchód wewn.)</option>
            <option value="mm">MM (przesunięcie)</option>
            <option value="inw">INW (inwentaryzacja)</option>
          </select>
        </label>
        <label>
          Data
          <input v-model="movement.date" type="date" />
        </label>
        <label>
          Kontrahent
          <select v-model="movement.contactId">
            <option value="">Brak</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
              {{ contact.name }}
            </option>
          </select>
        </label>
        <label>
          Magazyn
          <select v-model="movement.warehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label v-if="movement.type === 'mm'">
          Magazyn docelowy
          <select v-model="movement.toWarehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>
          Produkt *
          <select v-model="movement.itemId">
            <option value="">Wybierz produkt</option>
            <option v-for="item in filteredByWarehouse" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.stock }} {{ item.unit }})
            </option>
          </select>
        </label>
        <label v-if="movement.type !== 'inw'">
          Ilość *
          <input v-model.number="movement.quantity" type="number" min="1" />
        </label>
        <label v-else>
          Stan po inwentaryzacji *
          <input v-model.number="movement.quantity" type="number" min="0" />
        </label>
        <label class="full-width">
          Uwagi
          <input v-model.trim="movement.note" type="text" />
        </label>
      </div>
      <button class="primary-btn" @click="createMovement">Zapisz dokument</button>
    </section>

    <section class="card">
      <div class="table-header">
        <h2>Stany magazynowe</h2>
        <div class="table-actions">
          <select v-model="warehouseFilter">
            <option value="">Wszystkie magazyny</option>
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
          <input v-model.trim="query" placeholder="Szukaj w magazynie..." />
        </div>
      </div>
      <div class="alert-row" v-if="lowStockCount">
        Uwaga: {{ lowStockCount }} pozycji poniżej stanu minimalnego.
      </div>
      <table v-if="filteredInventory.length" class="warehouse-table">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>SKU</th>
            <th>Jednostka</th>
            <th>Magazyn</th>
            <th>Lokalizacja</th>
            <th>Stan</th>
            <th>Zarezerwowane</th>
            <th>Dostępne</th>
            <th>Min.</th>
            <th>Cena</th>
            <th>VAT</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredInventory" :key="item.id" :class="{ warning: isBelowMin(item) }">
            <td>{{ item.name }}</td>
            <td>{{ item.sku || '-' }}</td>
            <td>{{ item.unit }}</td>
            <td>{{ warehouseName(item.warehouseId) }}</td>
            <td>{{ item.location || '-' }}</td>
            <td>{{ item.stock }}</td>
            <td>{{ reservedForItem(item.id) }}</td>
            <td>{{ availableForItem(item.id, item.stock) }}</td>
            <td>{{ item.minStock ?? 0 }}</td>
            <td>{{ item.price.toFixed(2) }}</td>
            <td>{{ item.vat }}{{ item.vat === 'zw' ? '' : '%' }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="editItem(item)">Edytuj</button>
              <button class="danger-btn" @click="deleteItem(item.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak towarów</h3>
        <p>Dodaj pierwszy produkt, aby prowadzić magazyn.</p>
      </div>
    </section>

    <section class="card">
      <h2>Rezerwacje towaru</h2>
      <div class="form-grid">
        <label>
          Magazyn
          <select v-model="reservationForm.warehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>
          Produkt
          <select v-model="reservationForm.itemId">
            <option value="">Wybierz produkt</option>
            <option v-for="item in filteredReservationItems" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.stock }} {{ item.unit }})
            </option>
          </select>
        </label>
        <label>
          Ilość
          <input v-model.number="reservationForm.quantity" type="number" min="1" />
        </label>
        <label>
          Kontrahent
          <select v-model="reservationForm.contactId">
            <option value="">Brak</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
              {{ contact.name }}
            </option>
          </select>
        </label>
        <label>
          Termin ważności
          <input v-model="reservationForm.until" type="date" />
        </label>
        <label class="full-width">
          Notatka
          <input v-model.trim="reservationForm.note" type="text" />
        </label>
      </div>
      <button class="primary-btn" @click="saveReservation">Dodaj rezerwację</button>

      <table v-if="reservations.length" class="warehouse-table">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Magazyn</th>
            <th>Ilość</th>
            <th>Kontrahent</th>
            <th>Termin</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reservation in reservations" :key="reservation.id">
            <td>{{ itemName(reservation.itemId) }}</td>
            <td>{{ warehouseName(reservation.warehouseId) }}</td>
            <td>{{ reservation.quantity }}</td>
            <td>{{ contactName(reservation.contactId) }}</td>
            <td>{{ reservation.until || '-' }}</td>
            <td>{{ reservation.status === 'active' ? 'Aktywna' : 'Zrealizowana' }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="closeReservation(reservation)">Zamknij</button>
              <button class="danger-btn" @click="deleteReservation(reservation.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>Magazyny</h2>
      <div class="form-grid">
        <label>
          Nazwa magazynu
          <input v-model.trim="warehouseForm.name" type="text" />
        </label>
        <label>
          Kod
          <input v-model.trim="warehouseForm.code" type="text" />
        </label>
        <label>
          Lokalizacja
          <input v-model.trim="warehouseForm.location" type="text" />
        </label>
      </div>
      <div class="form-actions">
        <button class="ghost-btn" @click="resetWarehouseForm">Wyczyść</button>
        <button class="primary-btn" @click="saveWarehouse">
          {{ editingWarehouseId ? 'Zapisz' : 'Dodaj magazyn' }}
        </button>
      </div>

      <table v-if="warehouses.length" class="warehouse-table">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Kod</th>
            <th>Lokalizacja</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="warehouse in warehouses" :key="warehouse.id">
            <td>{{ warehouse.name }}</td>
            <td>{{ warehouse.code || '-' }}</td>
            <td>{{ warehouse.location || '-' }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="editWarehouse(warehouse)">Edytuj</button>
              <button class="danger-btn" @click="deleteWarehouse(warehouse.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>Partie i daty ważności (FEFO)</h2>
      <div class="form-grid">
        <label>
          Magazyn
          <select v-model="batchForm.warehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label>
          Produkt
          <select v-model="batchForm.itemId">
            <option value="">Wybierz produkt</option>
            <option v-for="item in batchItems" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>
        <label>
          Numer partii
          <input v-model.trim="batchForm.batchNumber" type="text" />
        </label>
        <label>
          Data ważności
          <input v-model="batchForm.expiryDate" type="date" />
        </label>
        <label>
          Ilość
          <input v-model.number="batchForm.quantity" type="number" min="1" />
        </label>
      </div>
      <button class="primary-btn" @click="addBatch">Dodaj partię</button>

      <table v-if="batchTableRows.length" class="warehouse-table">
        <thead>
          <tr>
            <th>Produkt</th>
            <th>Magazyn</th>
            <th>Partia</th>
            <th>Ważna do</th>
            <th>Ilość</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in batchTableRows" :key="row.id">
            <td>{{ row.itemName }}</td>
            <td>{{ warehouseName(row.warehouseId) }}</td>
            <td>{{ row.batchNumber || '-' }}</td>
            <td>{{ row.expiryDate || '-' }}</td>
            <td>{{ row.quantity }}</td>
            <td class="actions">
              <button class="danger-btn" @click="removeBatch(row)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getContacts } from '@/services/contacts'
import { addInventoryItem, getInventory, removeInventoryItem, updateInventoryItem } from '@/services/inventory'
import { addDocument, commitNumber } from '@/services/documents'
import { getSettings } from '@/services/settings'
import { exportCsv, parseCsv } from '@/services/csv'
import { addWarehouse, getWarehouses, removeWarehouse, updateWarehouse } from '@/services/warehouses'
import { addReservation, getReservations, removeReservation, updateReservation } from '@/services/reservations'

const router = useRouter()
const settings = ref(getSettings())
const inventory = ref([])
const contacts = ref([])
const warehouses = ref([])
const reservations = ref([])
const query = ref('')
const showItemForm = ref(false)
const editingId = ref('')
const fileInput = ref(null)
const warehouseFilter = ref('')
const editingWarehouseId = ref('')

const vatRates = computed(() => settings.value.tax.enabledVatRates)

const itemForm = ref({
  name: '',
  sku: '',
  unit: 'szt.',
  stock: 0,
  price: 0,
  vat: settings.value.tax.defaultVat,
  warehouseId: '',
  location: ''
})

const movement = ref({
  type: 'pz',
  date: new Date().toISOString().substring(0, 10),
  contactId: '',
  warehouseId: '',
  toWarehouseId: '',
  itemId: '',
  quantity: 1,
  note: ''
})

const reservationForm = ref({
  warehouseId: '',
  itemId: '',
  quantity: 1,
  contactId: '',
  until: '',
  note: ''
})

const batchForm = ref({
  warehouseId: '',
  itemId: '',
  batchNumber: '',
  expiryDate: '',
  quantity: 1
})

const warehouseForm = ref({
  name: '',
  code: '',
  location: ''
})

const filteredInventory = computed(() => {
  let base = inventory.value
  if (warehouseFilter.value) {
    base = base.filter((item) => item.warehouseId === warehouseFilter.value)
  }
  if (!query.value) return base
  const term = query.value.toLowerCase()
  return base.filter((item) =>
    [item.name, item.sku].filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
  )
})

const filteredByWarehouse = computed(() => {
  if (!movement.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === movement.value.warehouseId)
})

const filteredReservationItems = computed(() => {
  if (!reservationForm.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === reservationForm.value.warehouseId)
})

const batchItems = computed(() => {
  if (!batchForm.value.warehouseId) return inventory.value
  return inventory.value.filter((item) => item.warehouseId === batchForm.value.warehouseId)
})

const loadData = () => {
  inventory.value = getInventory()
  contacts.value = getContacts()
  warehouses.value = getWarehouses()
  reservations.value = getReservations()
  if (!itemForm.value.warehouseId && warehouses.value.length) {
    itemForm.value.warehouseId = warehouses.value[0].id
  }
  if (!movement.value.warehouseId && warehouses.value.length) {
    movement.value.warehouseId = warehouses.value[0].id
  }
  if (!reservationForm.value.warehouseId && warehouses.value.length) {
    reservationForm.value.warehouseId = warehouses.value[0].id
  }
  if (!batchForm.value.warehouseId && warehouses.value.length) {
    batchForm.value.warehouseId = warehouses.value[0].id
  }
}

const toggleItemForm = () => {
  showItemForm.value = !showItemForm.value
  if (!showItemForm.value) resetItemForm()
}

const resetItemForm = () => {
  editingId.value = ''
  itemForm.value = {
    name: '',
    sku: '',
    unit: 'szt.',
    stock: 0,
    price: 0,
    vat: settings.value.tax.defaultVat,
    warehouseId: warehouses.value[0]?.id || '',
    location: '',
    minStock: 0
  }
}

const saveItem = () => {
  if (!itemForm.value.name.trim()) {
    alert('Nazwa towaru jest wymagana.')
    return
  }

  if (editingId.value) {
    inventory.value = updateInventoryItem(editingId.value, { ...itemForm.value })
  } else {
    inventory.value = addInventoryItem({ ...itemForm.value })
  }

  showItemForm.value = false
  resetItemForm()
}

const editItem = (item) => {
  showItemForm.value = true
  editingId.value = item.id
  itemForm.value = { minStock: 0, ...item }
}

const deleteItem = (id) => {
  inventory.value = removeInventoryItem(id)
}

const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'
const itemName = (id) => inventory.value.find((item) => item.id === id)?.name || '-'
const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const isBelowMin = (item) => availableForItem(item.id, item.stock) < Number(item.minStock || 0)
const lowStockCount = computed(() => inventory.value.filter(isBelowMin).length)

const reservedForItem = (itemId) =>
  reservations.value
    .filter((reservation) => reservation.itemId === itemId && reservation.status === 'active')
    .reduce((sum, reservation) => sum + Number(reservation.quantity || 0), 0)

const availableForItem = (itemId, stock) => Math.max(0, Number(stock) - reservedForItem(itemId))

const resetWarehouseForm = () => {
  editingWarehouseId.value = ''
  warehouseForm.value = { name: '', code: '', location: '' }
}

const saveWarehouse = () => {
  if (!warehouseForm.value.name.trim()) {
    alert('Nazwa magazynu jest wymagana.')
    return
  }

  if (editingWarehouseId.value) {
    warehouses.value = updateWarehouse(editingWarehouseId.value, { ...warehouseForm.value })
  } else {
    warehouses.value = addWarehouse({ ...warehouseForm.value })
  }

  resetWarehouseForm()
}

const editWarehouse = (warehouse) => {
  editingWarehouseId.value = warehouse.id
  warehouseForm.value = { name: warehouse.name, code: warehouse.code || '', location: warehouse.location || '' }
}

const deleteWarehouse = (id) => {
  warehouses.value = removeWarehouse(id)
  if (warehouseFilter.value === id) warehouseFilter.value = ''
}

const saveReservation = () => {
  if (!reservationForm.value.itemId || !reservationForm.value.quantity) {
    alert('Wybierz produkt i ilość.')
    return
  }

  const item = inventory.value.find((entry) => entry.id === reservationForm.value.itemId)
  if (!item) return

  const available = availableForItem(item.id, item.stock)
  if (reservationForm.value.quantity > available) {
    alert('Brak wystarczającej ilości dostępnej do rezerwacji.')
    return
  }

  reservations.value = addReservation({ ...reservationForm.value })
  reservationForm.value = {
    warehouseId: reservationForm.value.warehouseId,
    itemId: '',
    quantity: 1,
    contactId: '',
    until: '',
    note: ''
  }
}

const closeReservation = (reservation) => {
  reservations.value = updateReservation(reservation.id, { status: 'closed' })
}

const deleteReservation = (id) => {
  reservations.value = removeReservation(id)
}

const normalizeItem = (item) => ({
  ...item,
  batches: Array.isArray(item.batches) ? item.batches : []
})

const addBatch = () => {
  if (!batchForm.value.itemId || !batchForm.value.quantity) {
    alert('Wybierz produkt i ilość.')
    return
  }

  const item = inventory.value.find((entry) => entry.id === batchForm.value.itemId)
  if (!item) return
  const normalized = normalizeItem(item)
  const newBatch = {
    id: crypto.randomUUID(),
    batchNumber: batchForm.value.batchNumber,
    expiryDate: batchForm.value.expiryDate,
    quantity: Number(batchForm.value.quantity)
  }

  const updated = {
    ...normalized,
    stock: Number(normalized.stock) + newBatch.quantity,
    batches: [newBatch, ...normalized.batches]
  }

  inventory.value = updateInventoryItem(normalized.id, updated)
  batchForm.value = {
    warehouseId: batchForm.value.warehouseId,
    itemId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 1
  }
}

const removeBatch = (row) => {
  const item = inventory.value.find((entry) => entry.id === row.itemId)
  if (!item) return
  const normalized = normalizeItem(item)
  const batch = normalized.batches.find((b) => b.id === row.id)
  if (!batch) return
  const updated = {
    ...normalized,
    stock: Math.max(0, Number(normalized.stock) - Number(batch.quantity)),
    batches: normalized.batches.filter((b) => b.id !== row.id)
  }
  inventory.value = updateInventoryItem(normalized.id, updated)
}

const batchTableRows = computed(() => {
  return inventory.value.flatMap((item) => {
    const normalized = normalizeItem(item)
    return normalized.batches.map((batch) => ({
      ...batch,
      itemId: normalized.id,
      itemName: normalized.name,
      warehouseId: normalized.warehouseId
    }))
  })
})

const consumeBatchesFefo = (item, quantity) => {
  const normalized = normalizeItem(item)
  if (!normalized.batches.length) return normalized

  const sorted = [...normalized.batches].sort((a, b) => {
    if (!a.expiryDate) return 1
    if (!b.expiryDate) return -1
    return a.expiryDate.localeCompare(b.expiryDate)
  })

  let remaining = quantity
  const updatedBatches = []

  sorted.forEach((batch) => {
    if (remaining <= 0) {
      updatedBatches.push(batch)
      return
    }
    if (batch.quantity > remaining) {
      updatedBatches.push({ ...batch, quantity: batch.quantity - remaining })
      remaining = 0
    } else {
      remaining -= batch.quantity
    }
  })

  return {
    ...normalized,
    batches: updatedBatches
  }
}

const exportInventory = () => {
  const rows = [
    ['name', 'sku', 'unit', 'stock', 'price', 'vat', 'minStock']
  ]
  inventory.value.forEach((item) => {
    rows.push([
      item.name,
      item.sku,
      item.unit,
      item.stock,
      item.price,
      item.vat,
      item.minStock ?? 0
    ])
  })
  exportCsv(rows, 'magazyn.csv')
}

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const rows = parseCsv(text)
  rows.forEach((row) => {
    if (!row.name) return
    addInventoryItem({
      name: row.name,
      sku: row.sku || '',
      unit: row.unit || 'szt.',
      stock: Number(row.stock || 0),
      price: Number(row.price || 0),
      vat: row.vat || settings.value.tax.defaultVat,
      minStock: Number(row.minStock || 0)
    })
  })
  loadData()
  event.target.value = ''
}

const createMovement = () => {
  const item = inventory.value.find((entry) => entry.id === movement.value.itemId)
  if (!item || movement.value.quantity === null || movement.value.quantity === undefined) {
    alert('Wybierz produkt oraz ilość.')
    return
  }

  if (movement.value.type === 'mm' && movement.value.toWarehouseId === movement.value.warehouseId) {
    alert('Wybierz inny magazyn docelowy.')
    return
  }

  const quantity = Number(movement.value.quantity)
  let nextStock = item.stock

  if (movement.value.type === 'pz') nextStock = item.stock + quantity
  if (movement.value.type === 'wz' || movement.value.type === 'rw') nextStock = item.stock - quantity
  if (movement.value.type === 'inw') nextStock = quantity

  if (nextStock < 0) {
    alert('Brak wystarczającego stanu magazynowego.')
    return
  }

  if (movement.value.type !== 'mm') {
    const updatedItem = {
      ...item,
      stock: nextStock,
      batches: consumeBatchesFefo(item, quantity).batches
    }
    inventory.value = updateInventoryItem(item.id, updatedItem)
  }

  if (movement.value.type === 'mm') {
    const updatedItem = {
      ...item,
      stock: item.stock - quantity,
      batches: consumeBatchesFefo(item, quantity).batches
    }
    if (updatedItem.stock < 0) {
      alert('Brak wystarczającego stanu magazynowego.')
      return
    }
    inventory.value = updateInventoryItem(item.id, updatedItem)

    const destination = inventory.value.find(
      (entry) => entry.warehouseId === movement.value.toWarehouseId && entry.name === item.name && entry.sku === item.sku
    )
    if (destination) {
      inventory.value = updateInventoryItem(destination.id, {
        ...destination,
        stock: destination.stock + quantity
      })
    } else {
      inventory.value = addInventoryItem({
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        stock: quantity,
        price: item.price,
        vat: item.vat,
        warehouseId: movement.value.toWarehouseId,
        location: ''
      })
    }
  }

  const contact = contacts.value.find((entry) => entry.id === movement.value.contactId)
  const number = commitNumber(movement.value.type, new Date(movement.value.date), settings.value)
  const vatValue = item.vat === 'zw' ? 0 : Number(item.vat)

  addDocument({
    id: crypto.randomUUID(),
    type: movement.value.type,
    number,
    issuer: {
      name: settings.value.company.name,
      nip: settings.value.company.nip,
      address: settings.value.company.address
    },
    counterparty: contact
      ? { name: contact.name, nip: contact.nip, address: contact.address }
      : { name: '—', nip: '', address: '' },
    document: {
      type: movement.value.type,
      number,
      issueDate: movement.value.date,
      saleDate: movement.value.date,
      notes: movement.value.note,
      warehouseId: movement.value.warehouseId,
      toWarehouseId: movement.value.toWarehouseId
    },
    items: [
      {
        description: item.name,
        quantity,
        price: item.price,
        vat: item.vat
      }
    ],
     currency: settings.value.tax.defaultCurrency,
     totals: {
       netto: (item.price * quantity).toFixed(2),
      vat: (item.price * quantity * (vatValue / 100)).toFixed(2),
      brutto: (item.price * quantity * (1 + vatValue / 100)).toFixed(2)
    }
   })

   movement.value = {
     type: movement.value.type,
     date: new Date().toISOString().substring(0, 10),
     contactId: '',
    warehouseId: movement.value.warehouseId,
    toWarehouseId: '',
     itemId: '',
     quantity: 1,
     note: ''
   }
 }

 const goHome = () => {
   router.push({ name: 'home' })
 }

 onMounted(loadData)
</script>

<style src="./Warehouse.css"></style>
