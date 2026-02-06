<template>
  <div class="contacts-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Baza kontrahentów</h1>
        <p>Zarządzaj klientami i dostawcami w jednym miejscu.</p>
      </div>
      <div class="header-actions">
        <input ref="fileInput" type="file" accept=".csv" hidden @change="handleImport" />
        <button class="ghost-btn" @click="exportContacts">Eksport CSV</button>
        <button class="ghost-btn" @click="triggerImport">Import CSV</button>
        <button class="primary-btn" @click="toggleForm">
          {{ showForm ? 'Zamknij' : 'Dodaj kontrahenta' }}
        </button>
      </div>
    </header>

    <section v-if="showForm" class="card">
      <h2>{{ editingId ? 'Edytuj kontrahenta' : 'Nowy kontrahent' }}</h2>
      <div class="form-grid">
        <label>
          Nazwa *
          <input v-model.trim="form.name" type="text" />
        </label>
        <label>
          NIP
          <input v-model.trim="form.nip" type="text" />
        </label>
        <label>
          Typ
          <select v-model="form.type">
            <option value="client">Klient</option>
            <option value="supplier">Dostawca</option>
            <option value="both">Klient i dostawca</option>
          </select>
        </label>
        <label>
          Cennik
          <select v-model="form.priceListId">
            <option value="">Domyślny</option>
            <option v-for="list in priceLists" :key="list.id" :value="list.id">
              {{ list.name }}
            </option>
          </select>
        </label>
        <label>
          Rabat klienta (%)
          <input v-model.number="form.discountPercent" type="number" min="0" max="100" />
        </label>
        <label>
          Telefon
          <input v-model.trim="form.phone" type="text" />
        </label>
        <label>
          E-mail
          <input v-model.trim="form.email" type="email" />
        </label>
        <label class="full-width">
          Adres
          <input v-model.trim="form.address" type="text" />
        </label>
        <label class="full-width">
          Notatka
          <textarea v-model.trim="form.note" rows="2"></textarea>
        </label>
      </div>
      <div class="form-actions">
        <button class="ghost-btn" @click="resetForm">Wyczyść</button>
        <button class="primary-btn" @click="saveContact">
          {{ editingId ? 'Zapisz zmiany' : 'Dodaj' }}
        </button>
      </div>
    </section>

    <section class="card">
      <div class="table-header">
        <h2>Lista kontrahentów</h2>
        <input v-model.trim="query" placeholder="Szukaj..." />
      </div>
      <table v-if="filteredContacts.length" class="contacts-table">
        <thead>
          <tr>
            <th>Nazwa</th>
            <th>Typ</th>
            <th>NIP</th>
            <th>Cennik</th>
            <th>Kontakt</th>
            <th>Adres</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="contact in filteredContacts" :key="contact.id">
            <td>{{ contact.name }}</td>
            <td>{{ typeLabels[contact.type] }}</td>
            <td>{{ contact.nip || '-' }}</td>
            <td>{{ priceListName(contact.priceListId) }}</td>
            <td>
              <div>{{ contact.phone || '-' }}</div>
              <div>{{ contact.email || '-' }}</div>
            </td>
            <td>{{ contact.address || '-' }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="editContact(contact)">Edytuj</button>
              <button class="danger-btn" @click="deleteContact(contact.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak kontrahentów</h3>
        <p>Dodaj pierwszego kontrahenta, aby przyspieszyć wystawianie dokumentów.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { addContact, getContacts, removeContact, updateContact } from '@/services/contacts'
import { exportCsv, parseCsv } from '@/services/csv'
import { getPriceLists } from '@/services/priceLists'

const router = useRouter()

const showForm = ref(false)
const editingId = ref('')
const contacts = ref([])
const query = ref('')
const fileInput = ref(null)
const priceLists = ref([])

const form = ref({
  name: '',
  nip: '',
  type: 'client',
  priceListId: '',
  discountPercent: 0,
  phone: '',
  email: '',
  address: '',
  note: ''
})

const typeLabels = {
  client: 'Klient',
  supplier: 'Dostawca',
  both: 'Klient i dostawca'
}

const filteredContacts = computed(() => {
  if (!query.value) return contacts.value
  const term = query.value.toLowerCase()
  return contacts.value.filter((contact) =>
    [contact.name, contact.nip, contact.email, contact.phone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const loadContacts = () => {
  contacts.value = getContacts()
  priceLists.value = getPriceLists()
}

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
}

const resetForm = () => {
  editingId.value = ''
  form.value = {
    name: '',
    nip: '',
    type: 'client',
    priceListId: '',
    discountPercent: 0,
    phone: '',
    email: '',
    address: '',
    note: ''
  }
}

const saveContact = () => {
  if (!form.value.name.trim()) {
    alert('Nazwa kontrahenta jest wymagana.')
    return
  }

  if (editingId.value) {
    contacts.value = updateContact(editingId.value, { ...form.value })
  } else {
    contacts.value = addContact({ ...form.value })
  }

  showForm.value = false
  resetForm()
}

const editContact = (contact) => {
  showForm.value = true
  editingId.value = contact.id
  form.value = { ...contact }
}

const deleteContact = (id) => {
  contacts.value = removeContact(id)
}

const priceListName = (id) => priceLists.value.find((list) => list.id === id)?.name || 'Domyślny'

const exportContacts = () => {
  const rows = [
    ['name', 'nip', 'type', 'priceListId', 'discountPercent', 'phone', 'email', 'address', 'note']
  ]
  contacts.value.forEach((contact) => {
    rows.push([
      contact.name,
      contact.nip,
      contact.type,
      contact.priceListId,
      contact.discountPercent ?? 0,
      contact.phone,
      contact.email,
      contact.address,
      contact.note
    ])
  })
  exportCsv(rows, 'kontrahenci.csv')
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
    const type = ['client', 'supplier', 'both'].includes(row.type) ? row.type : 'client'
    if (!row.name) return
    addContact({
      name: row.name,
      nip: row.nip || '',
      type,
      priceListId: row.priceListId || '',
      discountPercent: Number(row.discountPercent || 0),
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      note: row.note || ''
    })
  })
  loadContacts()
  event.target.value = ''
}

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(loadContacts)
</script>

<style src="./Contacts.css"></style>
