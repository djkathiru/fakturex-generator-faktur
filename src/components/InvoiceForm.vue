<template>
  <form @submit.prevent class="document-form">
    <header class="form-header">
      <button class="ghost-btn" type="button" @click="goToHome">Powrót</button>
      <div>
        <h1>Nowy dokument</h1>
        <p>Twórz faktury, paragony, PZ i wydatki w jednym miejscu.</p>
      </div>
      <button class="primary-btn" type="button" @click="goToPreview">
        Podgląd i zapis
      </button>
    </header>

    <section class="card">
      <h2>Typ dokumentu</h2>
      <div class="form-grid">
        <label>
          Rodzaj dokumentu
          <select v-model="document.type">
            <optgroup label="Sprzedaż">
              <option value="invoice">Faktura VAT</option>
              <option value="proforma">Proforma</option>
              <option value="advance">Faktura zaliczkowa</option>
              <option value="final">Faktura końcowa</option>
              <option value="correction">Korekta</option>
              <option value="receipt">Paragon</option>
            </optgroup>
            <optgroup label="Magazyn">
              <option value="pz">PZ (przyjęcie zewnętrzne)</option>
            </optgroup>
            <optgroup label="Finanse">
              <option value="expense">Wydatek</option>
            </optgroup>
          </select>
        </label>
        <label>
          Numer dokumentu
          <input :value="document.number" type="text" readonly />
        </label>
        <label>
          Data wystawienia
          <input v-model="document.issueDate" type="date" />
        </label>
        <label>
          Data sprzedaży
          <input v-model="document.saleDate" type="date" />
        </label>
        <label>
          Waluta
          <select v-model="document.currency">
            <option v-for="currencyOption in currencyOptions" :key="currencyOption" :value="currencyOption">
              {{ currencyOption }}
            </option>
          </select>
        </label>
        <label>
          Język dokumentu
          <select v-model="document.language">
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
        </label>
        <label v-if="showPaymentFields">
          Termin płatności
          <input v-model="document.dueDate" type="date" />
        </label>
        <label v-if="showPaymentFields">
          Metoda płatności
          <select v-model="document.paymentMethod">
            <option>Przelew</option>
            <option>Gotówka</option>
            <option>Karta</option>
            <option>Online</option>
          </select>
        </label>
        <label v-if="showPaymentFields">
          Status płatności
          <select v-model="document.paymentStatus">
            <option value="unpaid">Nieopłacona</option>
            <option value="paid">Opłacona</option>
          </select>
        </label>
        <label v-if="showRelatedSelect">
          Powiązany dokument
          <select v-model="document.relatedNumber">
            <option value="">Brak</option>
            <option v-for="doc in relatedDocuments" :key="doc.id" :value="doc.number">
              {{ doc.number }} — {{ doc.counterparty?.name || 'Kontrahent' }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <section v-if="isSalesDoc" class="card">
      <h2>Opcje sprzedaży</h2>
      <div class="form-grid">
        <label>
          Cennik
          <select v-model="selectedPriceListId">
            <option value="">Domyślny</option>
            <option v-for="list in priceLists" :key="list.id" :value="list.id">
              {{ list.name }}
            </option>
          </select>
        </label>
        <label>
          Magazyn do WZ
          <select v-model="selectedWarehouseId">
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
        </label>
        <label class="checkbox-row">
          <input v-model="autoWz" type="checkbox" />
          Automatycznie generuj WZ
        </label>
        <label>
          Rabat globalny (%)
          <input v-model.number="globalDiscount" type="number" min="0" max="100" />
        </label>
        <label>
          Kupon rabatowy
          <input v-model.trim="couponCode" type="text" placeholder="Kod kuponu" />
        </label>
      </div>
    </section>

    <section class="card">
      <h2>Dane wystawcy</h2>
      <div class="form-grid">
        <label>
          Nazwa firmy *
          <input v-model="issuer.name" type="text" :class="{ error: validated && !issuer.name }" />
        </label>
        <label>
          NIP *
          <input v-model="issuer.nip" type="text" :class="{ error: validated && !isValidNIP(issuer.nip) }" />
        </label>
        <label>
          Adres *
          <input v-model="issuer.address" type="text" :class="{ error: validated && !issuer.address }" />
        </label>
      </div>
    </section>

    <section class="card">
      <h2>{{ counterpartyTitle }}</h2>
      <div class="form-grid">
        <label>
          Wybierz kontrahenta
          <select v-model="selectedContactId" @change="applyContact">
            <option value="">Wpisz ręcznie</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
              {{ contact.name }}
            </option>
          </select>
        </label>
        <label>
          Nazwa *
          <input v-model="counterparty.name" type="text" :class="{ error: validated && !counterparty.name }" />
        </label>
        <label>
          NIP
          <input v-model="counterparty.nip" type="text" :class="{ error: validated && requireCounterpartyNip && !isValidNIP(counterparty.nip) }" />
        </label>
        <label>
          Adres *
          <input v-model="counterparty.address" type="text" :class="{ error: validated && !counterparty.address }" />
        </label>
      </div>
    </section>

    <section class="card">
      <h2>Pozycje</h2>
      <div class="items-list">
        <div v-for="(item, index) in items" :key="index" class="item-row">
          <div class="item-grid">
            <div>
              <select @change="applyProductToItem(index, $event.target.value)">
                <option value="">Wybierz z magazynu...</option>
                <option v-for="product in filteredProducts" :key="product.name" :value="product.name">
                  {{ product.name }}
                </option>
              </select>
              <input
                v-model="item.description"
                placeholder="Opis pozycji *"
                :class="{ error: validated && !item.description }"
              />
            </div>
            <input v-model.number="item.quantity" type="number" min="1" placeholder="Ilość *" :class="{ error: validated && item.quantity <= 0 }" />
            <input v-model.number="item.price" type="number" min="0" step="0.01" placeholder="Cena netto *" :class="{ error: validated && item.price < 0 }" />
            <input v-model.number="item.discountPercent" type="number" min="0" max="100" placeholder="Rabat %" />
            <select v-model="item.vat">
              <option v-for="rate in vatRates" :key="rate" :value="rate">
                {{ rate === 'zw' ? 'zw' : rate + '%' }}
              </option>
            </select>
            <input type="text" :value="formatNet(item)" disabled />
            <input type="text" :value="formatGross(item)" disabled />
          </div>
          <button class="danger-btn" type="button" @click="removeItem(index)">
            Usuń pozycję
          </button>
        </div>
      </div>
      <button class="ghost-btn" type="button" @click="addItem">Dodaj pozycję</button>
    </section>

    <section class="card">
      <h2>Uwagi</h2>
      <textarea v-model="document.notes" rows="3" placeholder="Dodatkowe informacje..."></textarea>
    </section>

    <section class="summary-card">
      <div>
        <p>Suma netto</p>
        <strong>{{ totalNetto }} {{ document.currency }}</strong>
      </div>
      <div>
        <p>VAT</p>
        <strong>{{ totalVat }} {{ document.currency }}</strong>
      </div>
      <div>
        <p>Suma brutto</p>
        <strong>{{ totalBrutto }} {{ document.currency }}</strong>
      </div>
      <button class="secondary-btn" type="button" @click="resetForm">Wyczyść formularz</button>
    </section>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getSettings } from '@/services/settings'
import { addDocument, commitNumber, getNextNumberPreview, getDocuments } from '@/services/documents'
import { getContacts } from '@/services/contacts'
import { getInventory, adjustInventoryStock } from '@/services/inventory'
import { getWarehouses } from '@/services/warehouses'
import { getPriceLists } from '@/services/priceLists'
import './InvoiceForm.css'

const router = useRouter()
const settings = ref(getSettings())

const issuer = ref({ name: '', nip: '', address: '' })
const counterparty = ref({ name: '', nip: '', address: '' })
const items = ref([{ description: '', quantity: 1, price: 0, vat: '23', discountPercent: 0, itemId: '' }])
const availableProducts = ref([])
const contacts = ref([])
const selectedContactId = ref('')
const warehouses = ref([])
const selectedWarehouseId = ref('')
const priceLists = ref([])
const selectedPriceListId = ref('')
const globalDiscount = ref(0)
const couponCode = ref('')
const autoWz = ref(true)
const validated = ref(false)
const existingDocuments = ref([])

const document = ref({
  type: 'invoice',
  number: '',
  issueDate: '',
  saleDate: '',
  dueDate: '',
  currency: 'PLN',
  paymentMethod: 'Przelew',
  paymentStatus: 'unpaid',
  relatedNumber: '',
  notes: '',
  language: 'pl'
})

const isSalesDoc = computed(() =>
  ['invoice', 'proforma', 'advance', 'final', 'correction', 'receipt'].includes(document.value.type)
)

const showPaymentFields = computed(() => isSalesDoc.value && document.value.type !== 'receipt')

const showRelatedSelect = computed(() =>
  ['final', 'correction'].includes(document.value.type)
)

const relatedDocuments = computed(() => {
  if (document.value.type === 'final') {
    return existingDocuments.value.filter((doc) => doc.type === 'advance')
  }
  if (document.value.type === 'correction') {
    return existingDocuments.value.filter((doc) =>
      ['invoice', 'final', 'advance', 'proforma'].includes(doc.type)
    )
  }
  return []
})

const counterpartyTitle = computed(() => {
  if (document.value.type === 'pz') return 'Dane dostawcy'
  if (document.value.type === 'expense') return 'Dane kontrahenta'
  return 'Dane nabywcy'
})

const requireCounterpartyNip = computed(() => isSalesDoc.value)

const vatRates = computed(() => settings.value.tax.enabledVatRates)
const currencyOptions = computed(() => settings.value.tax.enabledCurrencies)
const filteredProducts = computed(() => {
  if (!selectedWarehouseId.value) return availableProducts.value
  return availableProducts.value.filter((item) => item.warehouseId === selectedWarehouseId.value)
})

const addItem = () => items.value.push({ description: '', quantity: 1, price: 0, vat: settings.value.tax.defaultVat, discountPercent: 0, itemId: '' })
const removeItem = (index) => items.value.splice(index, 1)

const applyProductToItem = (index, productName) => {
  const product = availableProducts.value.find((p) => p.name === productName)
  if (product) {
    items.value[index].description = product.name
    items.value[index].price = resolvePrice(product.name)
    items.value[index].vat = String(product.vat)
    items.value[index].itemId = product.id
  }
}

const loadProducts = () => {
  availableProducts.value = getInventory()
}

const loadContacts = () => {
  contacts.value = getContacts()
}

const loadWarehouses = () => {
  warehouses.value = getWarehouses()
  if (!selectedWarehouseId.value && warehouses.value.length) {
    selectedWarehouseId.value = warehouses.value[0].id
  }
}

const loadPriceLists = () => {
  priceLists.value = getPriceLists()
}

const applyContact = () => {
  const contact = contacts.value.find((entry) => entry.id === selectedContactId.value)
  if (!contact) return
  counterparty.value = {
    name: contact.name,
    nip: contact.nip || '',
    address: contact.address || ''
  }
  selectedPriceListId.value = contact.priceListId || ''
  globalDiscount.value = Number(contact.discountPercent || settings.value.discounts.globalPercent || 0)
}

const loadCompanyData = () => {
  issuer.value = {
    name: settings.value.company.name || '',
    nip: settings.value.company.nip || '',
    address: [settings.value.company.address, settings.value.company.postalCode, settings.value.company.city]
      .filter(Boolean)
      .join(' ')
  }
}

const loadDocuments = () => {
  existingDocuments.value = getDocuments()
}

const updateNumber = () => {
  if (!document.value.issueDate) return
  const date = new Date(document.value.issueDate)
  document.value.number = getNextNumberPreview(document.value.type, date, settings.value)
}

const resetForm = () => {
  counterparty.value = { name: '', nip: '', address: '' }
  selectedContactId.value = ''
  items.value = [{ description: '', quantity: 1, price: 0, vat: settings.value.tax.defaultVat, discountPercent: 0, itemId: '' }]
  document.value = {
    type: document.value.type,
    number: '',
    issueDate: new Date().toISOString().substring(0, 10),
    saleDate: new Date().toISOString().substring(0, 10),
    dueDate: '',
    currency: settings.value.tax.defaultCurrency,
    paymentMethod: settings.value.payment.paymentMethod,
    paymentStatus: 'unpaid',
    relatedNumber: '',
    notes: '',
    language: settings.value.template.language || 'pl'
  }
  validated.value = false
  globalDiscount.value = settings.value.discounts.globalPercent || 0
  couponCode.value = ''
  updateNumber()
}

const vatToNumber = (vat) => {
  if (vat === 'zw') return 0
  const parsed = parseFloat(String(vat))
  return Number.isNaN(parsed) ? 0 : parsed
}

const baseNetto = computed(() =>
  items.value.reduce((sum, item) => {
    const discount = Number(item.discountPercent || 0) / 100
    return sum + item.quantity * item.price * (1 - discount)
  }, 0)
)

const thresholdDiscount = computed(() => {
  const threshold = [...(settings.value.discounts.thresholds || [])]
    .sort((a, b) => b.minNetto - a.minNetto)
    .find((rule) => baseNetto.value >= rule.minNetto)
  return threshold ? Number(threshold.percent || 0) : 0
})

const couponDiscount = computed(() => {
  const code = couponCode.value?.toUpperCase()
  const coupon = (settings.value.discounts.coupons || []).find((entry) => entry.code === code)
  return coupon ? Number(coupon.percent || 0) : 0
})

const totalDiscountPercent = computed(() =>
  Number(globalDiscount.value || 0) + thresholdDiscount.value + couponDiscount.value
)

const totalNetto = computed(() =>
  (baseNetto.value * (1 - totalDiscountPercent.value / 100)).toFixed(2)
)

const totalVat = computed(() => {
  const baseVat = items.value.reduce((sum, item) => {
    const discount = Number(item.discountPercent || 0) / 100
    return sum + item.quantity * item.price * (1 - discount) * (vatToNumber(item.vat) / 100)
  }, 0)
  const factor = baseNetto.value ? Number(totalNetto.value) / baseNetto.value : 1
  return (baseVat * factor).toFixed(2)
})

const totalBrutto = computed(() =>
  (Number(totalNetto.value) + Number(totalVat.value)).toFixed(2)
)

const formatNet = (item) => {
  const discount = Number(item.discountPercent || 0) / 100
  return `${(item.price * item.quantity * (1 - discount)).toFixed(2)} ${document.value.currency}`
}

const formatGross = (item) => {
  const discount = Number(item.discountPercent || 0) / 100
  return `${(item.price * item.quantity * (1 - discount) * (1 + vatToNumber(item.vat) / 100)).toFixed(2)} ${document.value.currency}`
}

const resolvePrice = (productName) => {
  if (!selectedPriceListId.value) {
    const product = availableProducts.value.find((entry) => entry.name === productName)
    return product ? Number(product.price) : 0
  }
  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  const item = list?.items?.find((entry) => entry.productName === productName)
  return item ? Number(item.price) : 0
}

const isValidNIP = (nip) => {
  if (!nip) return false
  const onlyDigits = nip.replace(/\D/g, '')
  return onlyDigits.length === 10
}

const validate = () => {
  const issuerValid = issuer.value.name && isValidNIP(issuer.value.nip) && issuer.value.address
  const counterpartyValid = counterparty.value.name && counterparty.value.address
  const nipValid = !requireCounterpartyNip.value || isValidNIP(counterparty.value.nip)
  const itemsValid = items.value.length > 0 && items.value.every((item) => item.description && item.quantity > 0 && item.price >= 0)
  return issuerValid && counterpartyValid && nipValid && document.value.issueDate && document.value.saleDate && itemsValid
}

const goToPreview = () => {
  validated.value = true
  if (!validate()) {
    alert('Uzupełnij poprawnie wszystkie wymagane pola przed przejściem do podglądu.')
    return
  }

  const issueDate = new Date(document.value.issueDate)
  const number = commitNumber(document.value.type, issueDate, settings.value)
  const filename = `${number}_${counterparty.value.name.replace(/\s+/g, '_')}.pdf`

  const newDoc = {
    id: crypto.randomUUID(),
    type: document.value.type,
    number,
    issuer: issuer.value,
    counterparty: counterparty.value,
    document: {
      ...document.value,
      number,
      issueDate: document.value.issueDate,
      saleDate: document.value.saleDate,
      dueDate: document.value.dueDate,
      language: document.value.language
    },
    items: items.value,
    currency: document.value.currency,
    totals: {
      netto: totalNetto.value,
      vat: totalVat.value,
      brutto: totalBrutto.value
    },
    filename
  }

  addDocument(newDoc)
  loadDocuments()

  if (autoWz.value && ['invoice', 'final', 'receipt'].includes(document.value.type)) {
    const wzNumber = commitNumber('wz', issueDate, settings.value)
    items.value.forEach((item) => {
      if (item.itemId) adjustInventoryStock(item.itemId, -Number(item.quantity))
    })

    addDocument({
      id: crypto.randomUUID(),
      type: 'wz',
      number: wzNumber,
      issuer: issuer.value,
      counterparty: counterparty.value,
      document: {
        type: 'wz',
        number: wzNumber,
        issueDate: document.value.issueDate,
        saleDate: document.value.saleDate,
        warehouseId: selectedWarehouseId.value
      },
      items: items.value.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        vat: item.vat
      })),
      currency: document.value.currency,
      totals: {
        netto: totalNetto.value,
        vat: totalVat.value,
        brutto: totalBrutto.value
      },
      filename: `${wzNumber}.pdf`
    })
  }

  router.push({
    name: 'InvoicePreview',
    query: {
      data: encodeURIComponent(JSON.stringify(newDoc))
    }
  })

  resetForm()
}

const goToHome = () => {
  router.push({ name: 'home' })
}

onMounted(() => {
  settings.value = getSettings()
  loadProducts()
  loadContacts()
  loadWarehouses()
  loadPriceLists()
  loadCompanyData()
  loadDocuments()
  const today = new Date().toISOString().substring(0, 10)
  document.value.issueDate = today
  document.value.saleDate = today
  document.value.currency = settings.value.tax.defaultCurrency
  document.value.paymentMethod = settings.value.payment.paymentMethod
  document.value.language = settings.value.template.language || 'pl'
  document.value.dueDate = new Date(Date.now() + settings.value.payment.paymentDays * 86400000)
    .toISOString()
    .substring(0, 10)
  globalDiscount.value = settings.value.discounts.globalPercent || 0
  updateNumber()
})

watch([() => document.value.type, () => document.value.issueDate], updateNumber)
</script>
