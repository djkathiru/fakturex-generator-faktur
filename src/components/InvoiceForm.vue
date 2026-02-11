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

    <div class="form-layout">
      <div class="form-main">
        <section class="card">
          <div class="card-header">
            <div>
              <h2>1. Podstawy dokumentu</h2>
              <p class="section-hint">Wybierz typ dokumentu i podstawowe daty.</p>
            </div>
          </div>
          <div class="form-grid">
            <label>
              Rodzaj dokumentu
              <select v-model="document.type" class="field-primary">
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
              <input :value="document.number" type="text" readonly class="field-secondary" />
              <span class="field-hint">Numer nadawany automatycznie według ustawień.</span>
            </label>
            <label>
              Data wystawienia
              <input v-model="document.issueDate" type="date" placeholder="Wybierz datę" class="field-primary" />
              <span class="field-hint">Dzień wystawienia dokumentu.</span>
            </label>
            <label>
              Data sprzedaży
              <input v-model="document.saleDate" type="date" placeholder="Wybierz datę" class="field-secondary" />
              <span class="field-hint">Data faktycznej sprzedaży/usługi.</span>
            </label>
            <label class="checkbox-row" v-if="showPaymentFields">
              <input v-model="showPaymentOptions" type="checkbox" />
              Pokaż opcje płatności
            </label>
            <template v-if="showPaymentFields && showPaymentOptions">
              <label>
                Termin płatności
                <input v-model="document.dueDate" type="date" placeholder="Wybierz termin" class="field-secondary" />
                <span class="field-hint">Domyślnie liczony z ustawień płatności.</span>
              </label>
              <label>
                Metoda płatności
                <select v-model="document.paymentMethod" class="field-secondary">
                  <option>Przelew</option>
                  <option>Gotówka</option>
                  <option>Karta</option>
                  <option>Online</option>
                </select>
                <span class="field-hint">Wyświetlana na dokumencie i w podglądzie.</span>
              </label>
              <label>
                Status płatności
                <select v-model="document.paymentStatus" class="field-secondary">
                  <option value="unpaid">Nieopłacona</option>
                  <option value="paid">Opłacona</option>
                </select>
                <span class="field-hint">Używane w rejestrze i filtrach płatności.</span>
              </label>
            </template>
            <label class="checkbox-row">
              <input v-model="showAdvancedOptions" type="checkbox" />
              Pokaż opcje zaawansowane
            </label>
            <template v-if="showAdvancedOptions">
              <label>
                Waluta
                <select v-model="document.currency" class="field-secondary">
                  <option v-for="currencyOption in currencyOptions" :key="currencyOption" :value="currencyOption">
                    {{ currencyOption }}
                  </option>
                </select>
              </label>
              <label v-if="document.currency !== settings.tax.defaultCurrency">
                Kurs waluty
                <input v-model.number="document.exchangeRate" type="number" min="0" step="0.0001" class="field-secondary" />
              </label>
              <label v-if="document.currency !== settings.tax.defaultCurrency">
                Data kursu
                <input v-model="document.exchangeDate" type="date" class="field-secondary" />
              </label>
              <label>
                Język dokumentu
                <select v-model="document.language" class="field-secondary">
                  <option value="pl">Polski</option>
                  <option value="en">English</option>
                </select>
              </label>
            </template>
            <label v-if="showRelatedSelect">
              Powiązany dokument
              <select v-model="document.relatedNumber" class="field-secondary">
                <option value="">Brak</option>
                <option v-for="doc in relatedDocuments" :key="doc.id" :value="doc.number">
                  {{ doc.number }} — {{ doc.counterparty?.name || 'Kontrahent' }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section v-if="isSalesDoc" class="card">
          <div class="card-header">
            <div>
              <h2>2. Sprzedaż i rabaty</h2>
              <p class="section-hint">Cenniki, rabaty i ustawienia magazynowe.</p>
            </div>
          </div>
          <div class="form-grid">
            <label>
              Cennik
              <select v-model="selectedPriceListId" class="field-secondary">
                <option value="">Domyślny</option>
                <option v-for="list in priceLists" :key="list.id" :value="list.id">
                  {{ list.name }}
                </option>
              </select>
              <span class="field-hint">Wybór cennika automatycznie uzupełni ceny pozycji.</span>
            </label>
            <label>
              Magazyn do WZ
              <select v-model="selectedWarehouseId" class="field-secondary">
                <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                  {{ warehouse.name }}
                </option>
              </select>
              <span class="field-hint">Dotyczy automatycznego dokumentu WZ.</span>
            </label>
            <label class="checkbox-row">
              <input v-model="autoWz" type="checkbox" />
              Automatycznie generuj WZ
            </label>
            <label>
              Rabat globalny (%)
              <input v-model.number="globalDiscount" type="number" min="0" max="100" class="field-secondary" />
              <span class="field-hint">Dodatkowy rabat naliczany na cały dokument.</span>
            </label>
            <label>
              Kupon rabatowy
              <input v-model.trim="couponCode" type="text" placeholder="Kod kuponu" class="field-secondary" />
              <span class="field-hint">Sprawdza kupony z ustawień.</span>
            </label>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <h2>3. Dane wystawcy</h2>
              <p class="section-hint">Możesz skorzystać z danych zapisanych w ustawieniach.</p>
            </div>
          </div>
          <div class="form-grid">
            <label class="checkbox-row">
              <input v-model="useCompanyData" type="checkbox" />
              Użyj danych firmy z ustawień
            </label>
          </div>
          <div v-if="useCompanyData" class="issuer-preview">
            <p><strong>{{ issuer.name || 'Brak nazwy firmy' }}</strong></p>
            <p>NIP: {{ issuer.nip || '—' }}</p>
            <p>Adres: {{ issuer.address || '—' }}</p>
          </div>
          <div v-else class="form-grid">
            <label>
              Nazwa firmy *
              <input v-model="issuer.name" type="text" placeholder="Np. Firma Sp. z o.o." :class="{ error: validated && !issuer.name }" class="field-primary" />
            </label>
            <label>
              NIP *
              <input v-model="issuer.nip" type="text" placeholder="Np. 1234567890" :class="{ error: validated && !isValidNIP(issuer.nip) }" class="field-secondary" />
            </label>
            <label>
              Adres *
              <input v-model="issuer.address" type="text" placeholder="Ulica, kod, miasto" :class="{ error: validated && !issuer.address }" class="field-secondary" />
            </label>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <h2>4. {{ counterpartyTitle }}</h2>
              <p class="section-hint">Wybierz kontrahenta lub wpisz dane ręcznie.</p>
            </div>
          </div>
          <div class="form-grid">
            <label>
              Wybierz kontrahenta
              <select v-model="selectedContactId" @change="applyContact" class="field-primary">
                <option value="">Wpisz ręcznie</option>
                <option v-for="contact in contacts" :key="contact.id" :value="contact.id">
                  {{ contact.name }}
                </option>
              </select>
            </label>
            <label>
              Nazwa *
              <input v-model="counterparty.name" type="text" placeholder="Np. Klient Sp. z o.o." :class="{ error: validated && !counterparty.name }" class="field-primary" />
            </label>
            <label>
              NIP
              <input v-model="counterparty.nip" type="text" placeholder="Np. 1234567890" :class="{ error: validated && requireCounterpartyNip && !isValidNIP(counterparty.nip) }" class="field-secondary" />
            </label>
            <label>
              Adres *
              <input v-model="counterparty.address" type="text" placeholder="Ulica, kod, miasto" :class="{ error: validated && !counterparty.address }" class="field-secondary" />
            </label>
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <h2>5. Pozycje dokumentu</h2>
              <p class="section-hint">Dodaj produkty z magazynu lub wpisz pozycje ręcznie.</p>
            </div>
          </div>
          <div class="item-grid item-grid--header">
            <span>Produkt / opis</span>
            <span>Ilość</span>
            <span>Cena netto</span>
            <span>Rabat</span>
            <span>VAT</span>
            <span>Netto</span>
            <span>Brutto</span>
          </div>
          <div class="items-list">
            <div v-for="(item, index) in items" :key="index" class="item-row">
              <div class="item-grid">
                <div>
                  <select @change="applyProductToItem(index, $event.target.value)" class="field-secondary">
                    <option value="">Wybierz z magazynu...</option>
                    <option v-for="product in filteredProducts" :key="product.name" :value="product.name">
                      {{ product.name }}
                    </option>
                  </select>
                  <input
                    v-model="item.description"
                    placeholder="Opis pozycji *"
                    :class="{ error: validated && !item.description }"
                    class="field-primary"
                  />
                </div>
                <input v-model.number="item.quantity" type="number" min="1" placeholder="Ilość *" :class="{ error: validated && item.quantity <= 0 }" class="field-primary" />
                <input v-model.number="item.price" type="number" min="0" step="0.01" placeholder="Cena netto *" :class="{ error: validated && item.price < 0 }" class="field-primary" />
                <input v-model.number="item.discountPercent" type="number" min="0" max="100" placeholder="Rabat %" class="field-secondary" />
                <select v-model="item.vat" class="field-secondary">
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
          <div class="card-header">
            <div>
              <h2>6. Uwagi</h2>
              <p class="section-hint">Dodatkowe informacje widoczne na dokumencie.</p>
            </div>
          </div>
          <textarea v-model="document.notes" rows="3" placeholder="Dodatkowe informacje..." class="field-secondary"></textarea>
        </section>
      </div>

      <aside class="form-side">
        <section class="summary-card sticky-card">
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

        <section class="card compact-card sticky-card">
          <h3>Podgląd wyborów</h3>
          <div class="overview-list">
            <div>
              <span>Typ dokumentu</span>
              <strong>{{ document.type }}</strong>
            </div>
            <div>
              <span>Kontrahent</span>
              <strong>{{ counterparty.name || 'Nie wybrano' }}</strong>
            </div>
            <div>
              <span>Cennik</span>
              <strong>{{ priceLists.find((list) => list.id === selectedPriceListId)?.name || 'Domyślny' }}</strong>
            </div>
            <div>
              <span>Waluta</span>
              <strong>{{ document.currency }}</strong>
            </div>
          </div>
        </section>

        <section class="card compact-card sticky-card">
          <h3>Szybkie wskazówki</h3>
          <ul class="hint-list">
            <li>Najpierw wybierz kontrahenta — cennik i rabat uzupełnią się automatycznie.</li>
            <li>Pozycje możesz dodawać z magazynu lub wpisać ręcznie.</li>
            <li>Opcje zaawansowane są ukryte, aby nie rozpraszać początkujących.</li>
          </ul>
        </section>
      </aside>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch, toRaw } from 'vue'
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
const showPaymentOptions = ref(false)
const showAdvancedOptions = ref(false)
const useCompanyData = ref(true)
const autoDueDate = ref('')

const document = ref({
  type: 'invoice',
  number: '',
  issueDate: '',
  saleDate: '',
  dueDate: '',
  currency: 'PLN',
  exchangeRate: null,
  exchangeDate: '',
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

const requireCounterpartyNip = computed(() =>
  ['invoice', 'proforma', 'advance', 'final', 'correction'].includes(document.value.type)
)

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
    items.value[index].price = resolvePrice(product.name, product.id)
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
  if (!contact) {
    selectedPriceListId.value = ''
    globalDiscount.value = settings.value.discounts.globalPercent || 0
    applyPriceListToItems()
    return
  }
  counterparty.value = {
    name: contact.name,
    nip: contact.nip || '',
    address: contact.address || ''
  }
  selectedPriceListId.value = contact.priceListId || ''
  globalDiscount.value = Number(contact.discountPercent || settings.value.discounts.globalPercent || 0)
  applyPriceListToItems()
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

const formatToday = () => new Date().toISOString().slice(0, 10)

const updateAutoDates = () => {
  if (!document.value.issueDate) return
  if (!document.value.saleDate) {
    document.value.saleDate = document.value.issueDate
  }

  if (document.value.currency !== settings.value.tax.defaultCurrency && !document.value.exchangeDate) {
    document.value.exchangeDate = document.value.issueDate
  }

  if (!isSalesDoc.value || document.value.type === 'receipt') return
  const days = Number(settings.value.payment.paymentDays || 0)
  const base = new Date(document.value.issueDate)
  base.setDate(base.getDate() + days)
  const next = base.toISOString().slice(0, 10)
  if (!document.value.dueDate || document.value.dueDate === autoDueDate.value) {
    document.value.dueDate = next
    autoDueDate.value = next
  }
}

const ensureDocumentDates = () => {
  if (!document.value.issueDate) {
    document.value.issueDate = formatToday()
  }
  if (!document.value.saleDate) {
    document.value.saleDate = document.value.issueDate
  }

  if (showPaymentFields.value && !document.value.dueDate) {
    const days = Number(settings.value.payment.paymentDays || 0)
    const base = new Date(document.value.issueDate)
    base.setDate(base.getDate() + days)
    document.value.dueDate = base.toISOString().slice(0, 10)
  }
}

const resetForm = () => {
  counterparty.value = { name: '', nip: '', address: '' }
  selectedContactId.value = ''
  items.value = [{ description: '', quantity: 1, price: 0, vat: settings.value.tax.defaultVat, discountPercent: 0, itemId: '' }]
  const today = formatToday()
  document.value = {
    type: document.value.type,
    number: '',
    issueDate: today,
    saleDate: today,
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
  showPaymentOptions.value = false
  showAdvancedOptions.value = false
  useCompanyData.value = true
  loadCompanyData()
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

const resolvePrice = (productName, productId = '') => {
  if (!selectedPriceListId.value) {
    const product = availableProducts.value.find((entry) =>
      (productId && entry.id === productId) || entry.name === productName
    )
    return product ? Number(product.price) : 0
  }
  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  const item = list?.items?.find((entry) =>
    (productId && entry.productId === productId) || entry.productName === productName
  )
  return item ? Number(item.price) : 0
}

const resolvePriceForItem = (item) => {
  const product = availableProducts.value.find((p) => p.id === item.itemId)
  const name = item.description || product?.name
  if (!name && !product?.id) return item.price

  if (!selectedPriceListId.value) {
    if (product) return Number(product.price)
    const match = availableProducts.value.find((entry) => entry.name === name)
    return match ? Number(match.price) : item.price
  }

  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  const found = list?.items?.find((entry) =>
    (product?.id && entry.productId === product.id) || entry.productName === name
  )
  return found ? Number(found.price) : item.price
}

const applyPriceListToItems = () => {
  if (!items.value.length) return
  items.value = items.value.map((item) => ({
    ...item,
    price: resolvePriceForItem(item)
  }))

  const list = priceLists.value.find((entry) => entry.id === selectedPriceListId.value)
  if (list?.currency) {
    document.value.currency = list.currency
  } else {
    document.value.currency = settings.value.tax.defaultCurrency
  }
}

const isValidNIP = (nip) => {
  if (!nip) return false
  const onlyDigits = nip.replace(/\D/g, '')
  return onlyDigits.length === 10
}

const validate = () => {
  const issuerName = issuer.value.name || settings.value.company.name || ''
  const issuerValid = !!issuerName
  const counterpartyValid = counterparty.value.name
  const nipValid = !requireCounterpartyNip.value || (counterparty.value.nip ? isValidNIP(counterparty.value.nip) : true)
  const itemsValid = items.value.length > 0 && items.value.every((item) => item.description && item.quantity > 0 && item.price >= 0)
  return issuerValid && counterpartyValid && nipValid && document.value.issueDate && document.value.saleDate && itemsValid
}

const goToPreview = () => {
  try {
    ensureDocumentDates()
    validated.value = true
    if (!validate()) {
      alert('Uzupełnij poprawnie wszystkie wymagane pola przed przejściem do podglądu.')
      return
    }

    const issueDateRaw = document.value.issueDate || formatToday()
    const issueDate = new Date(issueDateRaw)
    const safeDate = isNaN(issueDate) ? new Date() : issueDate
    const number = commitNumber(document.value.type, safeDate, settings.value)
    const safeName = String(counterparty.value.name || 'kontrahent')
    const filename = `${number}_${safeName.replace(/\s+/g, '_')}.pdf`

    const clone = (value) => {
      const raw = toRaw(value)
      if (typeof structuredClone === 'function') {
        try {
          return structuredClone(raw)
        } catch {
          // fallback below
        }
      }
      return JSON.parse(JSON.stringify(raw))
    }
    const createId = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

    const issuerData = clone(issuer.value)
    const counterpartyData = clone(counterparty.value)
    const itemsData = clone(items.value)
    const documentData = clone(document.value)

    const newDoc = {
      id: createId(),
      type: document.value.type,
      number,
      issuer: issuerData,
      counterparty: counterpartyData,
      document: {
        ...documentData,
        number,
        issueDate: document.value.issueDate,
        saleDate: document.value.saleDate,
        dueDate: document.value.dueDate,
        language: document.value.language
      },
      items: itemsData,
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
      const wzNumber = commitNumber('wz', safeDate, settings.value)
      items.value.forEach((item) => {
        if (item.itemId) adjustInventoryStock(item.itemId, -Number(item.quantity))
      })

      addDocument({
        id: createId(),
        type: 'wz',
        number: wzNumber,
        issuer: issuerData,
        counterparty: counterpartyData,
        document: {
          type: 'wz',
          number: wzNumber,
          issueDate: document.value.issueDate,
          saleDate: document.value.saleDate,
          warehouseId: selectedWarehouseId.value
        },
        items: itemsData.map((item) => ({
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
  } catch (error) {
    console.error('Błąd zapisu dokumentu:', error)
    const details = error?.message ? `\nSzczegóły: ${error.message}` : ''
    alert(`Nie udało się zapisać dokumentu. Sprawdź wymagane pola i spróbuj ponownie.${details}`)
  }
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
  if (!settings.value.company?.name) {
    useCompanyData.value = false
  }
  loadDocuments()
  if (!document.value.issueDate) {
    const today = formatToday()
    document.value.issueDate = today
    document.value.saleDate = today
  }
  document.value.currency = settings.value.tax.defaultCurrency
  document.value.paymentMethod = settings.value.payment.paymentMethod
  document.value.language = settings.value.template.language || 'pl'
  globalDiscount.value = settings.value.discounts.globalPercent || 0
  updateNumber()
  updateAutoDates()
})

watch([() => document.value.type, () => document.value.issueDate], () => {
  updateNumber()
  updateAutoDates()
})
watch(() => selectedPriceListId.value, applyPriceListToItems)
watch(
  () => useCompanyData.value,
  (useDefaults) => {
    if (useDefaults) {
      loadCompanyData()
    }
  }
)
</script>
