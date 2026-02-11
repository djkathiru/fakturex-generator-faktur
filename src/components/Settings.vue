<template>
  <div id="top" class="settings-page">
    <header class="settings-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Ustawienia</h1>
        <p>Konfiguracja firmy, numeracji dokumentów i szablonów.</p>
      </div>
      <button class="primary-btn" @click="saveSettings">Zapisz ustawienia</button>
    </header>

    <div class="settings-layout">
      <aside class="settings-sidebar">
        <h3>Panel ustawień</h3>
        <nav>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'company' }"
            @click="selectSection('company')"
          >
            Ustawienia firmy
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'branding' }"
            @click="selectSection('branding')"
          >
            Branding i szablon
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'discounts' }"
            @click="selectSection('discounts')"
          >
            Rabaty i kupony
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'numbering' }"
            @click="selectSection('numbering')"
          >
            Numeracja dokumentów
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'personalization' }"
            @click="selectSection('personalization')"
          >
            Punkt personalizacji
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'performance' }"
            @click="selectSection('performance')"
          >
            Punkt wydajności
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'mobile' }"
            @click="selectSection('mobile')"
          >
            Mobilne UX
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'tax' }"
            @click="selectSection('tax')"
          >
            Stawki VAT i waluty
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'payments' }"
            @click="selectSection('payments')"
          >
            Płatności i bank
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'permissions' }"
            @click="selectSection('permissions')"
          >
            Ustawienia uprawnień
          </button>
          <button
            class="sidebar-link"
            :class="{ active: activeSection === 'users' }"
            @click="selectSection('users')"
          >
            Użytkownicy i role
          </button>
        </nav>
      </aside>

      <div class="settings-grid">
      <div v-if="!activeSection" class="card empty-state">
        <h2>Wybierz kategorię ustawień</h2>
        <p>Po lewej stronie kliknij interesującą sekcję, aby rozpocząć konfigurację.</p>
      </div>

      <section v-if="activeSection === 'company'" id="company" class="card">
        <h2>Dane firmy</h2>
        <div class="form-grid">
          <label>
            Nazwa firmy
            <input v-model.trim="settings.company.name" type="text" />
          </label>
          <label>
            NIP
            <input v-model.trim="settings.company.nip" type="text" />
          </label>
          <label>
            REGON
            <input v-model.trim="settings.company.regon" type="text" />
          </label>
          <label>
            Ulica i numer
            <input v-model.trim="settings.company.address" type="text" />
          </label>
          <label>
            Kod pocztowy
            <input v-model.trim="settings.company.postalCode" type="text" />
          </label>
          <label>
            Miasto
            <input v-model.trim="settings.company.city" type="text" />
          </label>
          <label>
            Kraj
            <input v-model.trim="settings.company.country" type="text" />
          </label>
          <label>
            Telefon
            <input v-model.trim="settings.company.phone" type="text" />
          </label>
          <label>
            E-mail
            <input v-model.trim="settings.company.email" type="email" />
          </label>
          <label>
            Strona WWW
            <input v-model.trim="settings.company.website" type="text" />
          </label>
        </div>
      </section>

      <section v-if="activeSection === 'branding'" id="branding" class="card">
        <h2>Branding i szablon</h2>
        <div class="form-grid">
          <label class="file-label">
            Logo firmy
            <input type="file" @change="handleLogoUpload" accept="image/png, image/jpeg" />
          </label>
          <label>
            Kolor akcentu
            <input v-model="settings.template.accentColor" type="color" />
          </label>
          <label class="full-width">
            Stopka dokumentu
            <textarea v-model.trim="settings.template.footerNote" rows="3"></textarea>
          </label>
          <label class="checkbox-row full-width">
            <input v-model="settings.template.showPaymentInfo" type="checkbox" />
            Pokazuj informacje o płatności na dokumentach
          </label>
          <label>
            Układ szablonu
            <select v-model="settings.template.layout">
              <option value="classic">Klasyczny</option>
              <option value="compact">Kompaktowy</option>
              <option value="minimal">Minimalny</option>
            </select>
          </label>
          <label>
            Język dokumentów
            <select v-model="settings.template.language">
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </label>
          <label class="full-width">
            Warunki sprzedaży
            <textarea v-model.trim="settings.template.terms" rows="3"></textarea>
          </label>
        </div>
        <div class="logo-preview" v-if="settings.template.logo">
          <img :src="settings.template.logo" alt="Logo firmy" />
        </div>
        <div class="template-preview" :style="{ '--accent': settings.template.accentColor }">
          <div class="preview-header">
            <span>Faktura VAT</span>
            <span>#FV/01/2026</span>
          </div>
          <div class="preview-body">
            <div>
              <strong>{{ settings.company.name || 'Twoja firma' }}</strong>
              <p>{{ settings.company.address || 'Adres firmy' }}</p>
            </div>
            <div class="preview-accent">Suma: 1 234,00 {{ settings.tax.defaultCurrency }}</div>
          </div>
        </div>
      </section>

      <section v-if="activeSection === 'discounts'" id="discounts" class="card">
        <h2>Rabaty i kupony</h2>
        <div class="form-grid">
          <label>
            Rabat globalny (%)
            <input v-model.number="settings.discounts.globalPercent" type="number" min="0" max="100" />
          </label>
        </div>
        <div class="full-width">
          <p class="sub-label">Rabaty progowe</p>
          <div class="chip-grid">
            <div v-for="(rule, index) in settings.discounts.thresholds" :key="index" class="chip">
              od {{ rule.minNetto }} PLN → {{ rule.percent }}%
              <button class="chip-remove" @click="removeThreshold(index)">×</button>
            </div>
          </div>
          <div class="form-grid">
            <label>
              Próg netto
              <input v-model.number="thresholdForm.minNetto" type="number" min="0" />
            </label>
            <label>
              Rabat (%)
              <input v-model.number="thresholdForm.percent" type="number" min="0" max="100" />
            </label>
          </div>
          <button class="ghost-btn" @click="addThreshold">Dodaj próg</button>
        </div>

        <div class="full-width">
          <p class="sub-label">Kupony</p>
          <div class="chip-grid">
            <div v-for="(coupon, index) in settings.discounts.coupons" :key="index" class="chip">
              {{ coupon.code }} → {{ coupon.percent }}%
              <button class="chip-remove" @click="removeCoupon(index)">×</button>
            </div>
          </div>
          <div class="form-grid">
            <label>
              Kod kuponu
              <input v-model.trim="couponForm.code" type="text" />
            </label>
            <label>
              Rabat (%)
              <input v-model.number="couponForm.percent" type="number" min="0" max="100" />
            </label>
          </div>
          <button class="ghost-btn" @click="addCoupon">Dodaj kupon</button>
        </div>
      </section>

      <section v-if="activeSection === 'numbering'" id="numbering" class="card compact-card">
        <h2>Numeracja dokumentów</h2>
        <div class="form-grid dense-grid">
          <label>
            Start numeracji
            <input v-model.number="settings.numbering.startNumber" type="number" min="1" />
          </label>
          <label class="checkbox-row">
            <input v-model="settings.numbering.resetYearly" type="checkbox" />
            Resetuj co rok
          </label>
          <label>
            Prefiks faktury VAT
            <input v-model.trim="settings.numbering.invoicePrefix" type="text" />
          </label>
          <label>
            Prefiks proformy
            <input v-model.trim="settings.numbering.proformaPrefix" type="text" />
          </label>
          <label>
            Prefiks zaliczkowej
            <input v-model.trim="settings.numbering.advancePrefix" type="text" />
          </label>
          <label>
            Prefiks końcowej
            <input v-model.trim="settings.numbering.finalPrefix" type="text" />
          </label>
          <label>
            Prefiks korekty
            <input v-model.trim="settings.numbering.correctionPrefix" type="text" />
          </label>
          <label>
            Prefiks paragonu
            <input v-model.trim="settings.numbering.receiptPrefix" type="text" />
          </label>
          <label>
            Prefiks PZ (przyjęcie zewn.)
            <input v-model.trim="settings.numbering.pzPrefix" type="text" />
          </label>
          <label>
            Prefiks WZ (wydanie zewn.)
            <input v-model.trim="settings.numbering.wzPrefix" type="text" />
          </label>
          <label>
            Prefiks RW (rozchód wewn.)
            <input v-model.trim="settings.numbering.rwPrefix" type="text" />
          </label>
          <label>
            Prefiks MM (przesunięcie)
            <input v-model.trim="settings.numbering.mmPrefix" type="text" />
          </label>
          <label>
            Prefiks INW (inwentaryzacja)
            <input v-model.trim="settings.numbering.inwPrefix" type="text" />
          </label>
          <label>
            Prefiks SO (zam. sprzedaży)
            <input v-model.trim="settings.numbering.soPrefix" type="text" />
          </label>
          <label>
            Prefiks PO (zam. zakupu)
            <input v-model.trim="settings.numbering.poPrefix" type="text" />
          </label>
          <label>
            Prefiks RMA (zwrot)
            <input v-model.trim="settings.numbering.rmaPrefix" type="text" />
          </label>
          <label>
            Prefiks wydatków
            <input v-model.trim="settings.numbering.expensePrefix" type="text" />
          </label>
        </div>
      </section>

      <section v-if="activeSection === 'personalization'" id="personalization" class="card">
        <h2>Punkt personalizacji</h2>
        <div class="form-grid">
          <label>
            Motyw
            <select v-model="settings.ui.theme">
              <option value="light">Jasny</option>
              <option value="dark">Ciemny</option>
            </select>
          </label>
          <label>
            Gęstość interfejsu
            <select v-model="settings.ui.density">
              <option value="comfortable">Komfortowa</option>
              <option value="compact">Kompaktowa</option>
            </select>
          </label>
          <label class="checkbox-row">
            <input v-model="settings.ui.roundedCards" type="checkbox" />
            Zaokrąglone kafelki
          </label>
          <label class="checkbox-row">
            <input v-model="settings.ui.highContrast" type="checkbox" />
            Wysoki kontrast
          </label>
        </div>
      </section>

      <section v-if="activeSection === 'performance'" id="performance" class="card">
        <h2>Punkt wydajności</h2>
        <div class="form-grid">
          <label class="checkbox-row">
            <input v-model="settings.performance.reduceAnimations" type="checkbox" />
            Ogranicz animacje
          </label>
          <label class="checkbox-row">
            <input v-model="settings.performance.lowDataMode" type="checkbox" />
            Tryb oszczędzania danych
          </label>
          <label class="checkbox-row">
            <input v-model="settings.performance.enableCache" type="checkbox" />
            Buforuj dane lokalnie
          </label>
        </div>
      </section>

      <section v-if="activeSection === 'mobile'" id="mobile" class="card">
        <h2>Mobilne UX</h2>
        <div class="form-grid">
          <label class="checkbox-row">
            <input v-model="settings.mobileUx.enableMobileMode" type="checkbox" />
            Włącz tryb mobilny
          </label>
          <label class="checkbox-row">
            <input v-model="settings.mobileUx.largeTouchTargets" type="checkbox" />
            Duże obszary dotyku
          </label>
          <label class="checkbox-row">
            <input v-model="settings.mobileUx.stickyActions" type="checkbox" />
            Przyklejone akcje na dole
          </label>
        </div>
      </section>

      <section v-if="activeSection === 'tax'" id="tax" class="card">
        <h2>Stawki VAT i waluty</h2>
        <div class="form-grid">
          <label>
            Domyślna stawka VAT
            <select v-model="settings.tax.defaultVat">
              <option v-for="rate in vatOptions" :key="rate.value" :value="rate.value">
                {{ rate.label }}
              </option>
            </select>
          </label>
          <label>
            Domyślna waluta
            <select v-model="settings.tax.defaultCurrency">
              <option v-for="currency in currencyOptions" :key="currency" :value="currency">
                {{ currency }}
              </option>
            </select>
          </label>
          <div class="full-width">
            <p class="sub-label">Dostępne stawki VAT</p>
            <div class="chip-grid">
              <label v-for="rate in vatOptions" :key="rate.value" class="chip">
                <input
                  v-model="settings.tax.enabledVatRates"
                  type="checkbox"
                  :value="rate.value"
                />
                {{ rate.label }}
              </label>
            </div>
          </div>
          <div class="full-width">
            <p class="sub-label">Dostępne waluty</p>
            <div class="chip-grid">
              <label v-for="currency in currencyOptions" :key="currency" class="chip">
                <input
                  v-model="settings.tax.enabledCurrencies"
                  type="checkbox"
                  :value="currency"
                />
                {{ currency }}
              </label>
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeSection === 'payments'" id="payments" class="card">
        <h2>Płatności i bank</h2>
        <div class="form-grid">
          <label>
            Nazwa banku
            <input v-model.trim="settings.payment.bankName" type="text" />
          </label>
          <label>
            Numer rachunku (IBAN)
            <input v-model.trim="settings.payment.bankAccount" type="text" />
          </label>
          <label>
            Termin płatności (dni)
            <input v-model.number="settings.payment.paymentDays" type="number" min="0" />
          </label>
          <label>
            Sposób płatności
            <select v-model="settings.payment.paymentMethod">
              <option>Przelew</option>
              <option>Gotówka</option>
              <option>Karta</option>
              <option>Online</option>
            </select>
          </label>
        </div>
      </section>

      <section v-if="activeSection === 'permissions'" id="permissions" class="card compact-card">
        <h2>Role i uprawnienia</h2>
        <p class="sub-label">Przypisz uprawnienia per rola — zobaczysz też, kto ma daną rolę.</p>
        <div class="permissions-grid">
          <article v-for="role in roles" :key="role" class="permission-card">
            <header>
              <h3>{{ roleLabel(role) }}</h3>
              <p class="muted">Użytkownicy: {{ usersByRole[role]?.length || 0 }}</p>
            </header>
            <div class="role-users" v-if="usersByRole[role]?.length">
              <span v-for="userItem in usersByRole[role]" :key="userItem.email" class="chip">
                {{ userItem.name || userItem.email }}
              </span>
            </div>
            <div class="permissions-list">
              <label v-for="perm in permissionList" :key="perm.key" class="perm-item">
                <input v-model="settings.permissions[role][perm.key]" type="checkbox" />
                <span>{{ perm.label }}</span>
              </label>
            </div>
          </article>
        </div>
      </section>

      <section v-if="activeSection === 'users'" id="users" class="card compact-card">
        <h2>Użytkownicy i role</h2>
        <p class="sub-label">Przypisania ról dla kont użytkowników.</p>
        <div class="users-list">
          <article v-for="userItem in users" :key="userItem.email" class="user-card">
            <div class="user-meta">
              <div class="user-line user-name">{{ userItem.name }}</div>
              <div class="user-line user-role">Rola: {{ roleLabel(userItem.role) }}</div>
              <div class="user-line user-email">Email: {{ userItem.email }}</div>
            </div>
            <select
              class="role-select"
              :value="userItem.role"
              @change="onUserRoleChange(userItem.email, $event.target.value)"
            >
              <option v-for="role in roles" :key="role" :value="role">
                {{ roleLabel(role) }}
              </option>
            </select>
          </article>
        </div>
      </section>
      </div>
    </div>

    <button class="back-to-top" @click="scrollToTop">Powrót na górę</button>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, toRaw, watch } from 'vue'
import { useRouter } from 'vue-router'
import { defaultSettings, getSettings, saveSettings as saveSettingsToStore } from '@/services/settings'
import { getUsers, updateUserRole } from '@/services/auth'

const router = useRouter()

const vatOptions = [
  { value: '23', label: '23%' },
  { value: '8', label: '8%' },
  { value: '5', label: '5%' },
  { value: '0', label: '0%' },
  { value: 'zw', label: 'zw' }
]

const currencyOptions = ['PLN', 'EUR', 'USD', 'GBP', 'CZK']

const settings = reactive(structuredClone(defaultSettings))

const permissionList = [
  { key: 'manageSettings', label: 'Ustawienia' },
  { key: 'manageUsers', label: 'Użytkownicy i role' },
  { key: 'manageDocuments', label: 'Dokumenty' },
  { key: 'createDocuments', label: 'Wystawianie dokumentów' },
  { key: 'manageInvoices', label: 'Faktury i podglądy' },
  { key: 'managePayments', label: 'Płatności' },
  { key: 'manageReports', label: 'Raporty' },
  { key: 'manageContacts', label: 'Kontrahenci' },
  { key: 'manageWarehouse', label: 'Magazyn' },
  { key: 'manageSalesOrders', label: 'Zamówienia sprzedaży' },
  { key: 'managePurchaseOrders', label: 'Zamówienia zakupu' },
  { key: 'managePicking', label: 'Kompletacja (picking)' },
  { key: 'manageReturns', label: 'Zwroty (RMA)' },
  { key: 'managePriceLists', label: 'Cenniki' }
]

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const roleOrder = ['OWNER', 'ACCOUNTANT', 'VIEWER']

const roles = computed(() => {
  const existing = Object.keys(settings.permissions || {})
  const ordered = roleOrder.filter((role) => existing.includes(role))
  const rest = existing.filter((role) => !roleOrder.includes(role))
  return [...ordered, ...rest]
})

const roleLabel = (role) => roleLabels[role] ?? role

const users = ref([])
const activeSection = ref(null)
const isLoading = ref(true)
let saveTimer = null

const usersByRole = computed(() => {
  return users.value.reduce((acc, userItem) => {
    const role = userItem.role || 'unknown'
    if (!acc[role]) acc[role] = []
    acc[role].push(userItem)
    return acc
  }, {})
})

const thresholdForm = reactive({ minNetto: 0, percent: 0 })
const couponForm = reactive({ code: '', percent: 0 })

const loadSettings = () => {
  const parsed = getSettings()
  Object.assign(settings.company, parsed.company ?? {})
  Object.assign(settings.template, parsed.template ?? {})
  Object.assign(settings.numbering, parsed.numbering ?? {})
  Object.assign(settings.tax, parsed.tax ?? {})
  Object.assign(settings.payment, parsed.payment ?? {})
  Object.assign(settings.discounts, parsed.discounts ?? {})
  Object.assign(settings.ui, parsed.ui ?? {})
  Object.assign(settings.performance, parsed.performance ?? {})
  Object.assign(settings.mobileUx, parsed.mobileUx ?? {})
  settings.discounts.thresholds = parsed.discounts?.thresholds ?? settings.discounts.thresholds
  settings.discounts.coupons = parsed.discounts?.coupons ?? settings.discounts.coupons
  settings.permissions = parsed.permissions ?? settings.permissions
  ensureDefaults()
  isLoading.value = false
}

const loadUsers = () => {
  users.value = getUsers()
}

const selectSection = (section) => {
  activeSection.value = section
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const ensureDefaults = () => {
  if (!settings.tax.enabledVatRates.includes(settings.tax.defaultVat)) {
    settings.tax.enabledVatRates.push(settings.tax.defaultVat)
  }
  if (!settings.tax.enabledCurrencies.includes(settings.tax.defaultCurrency)) {
    settings.tax.enabledCurrencies.push(settings.tax.defaultCurrency)
  }

  const defaults = defaultSettings.permissions
  Object.keys(defaults).forEach((role) => {
    if (!settings.permissions[role]) settings.permissions[role] = {}
    permissionList.forEach(({ key }) => {
      if (settings.permissions[role][key] === undefined) {
        settings.permissions[role][key] = !!defaults[role]?.[key]
      }
    })
  })
  Object.keys(settings.permissions || {}).forEach((role) => {
    permissionList.forEach(({ key }) => {
      if (settings.permissions[role][key] === undefined) {
        settings.permissions[role][key] = false
      }
    })
  })
}

const addThreshold = () => {
  if (!thresholdForm.minNetto || !thresholdForm.percent) return
  settings.discounts.thresholds.push({
    minNetto: Number(thresholdForm.minNetto),
    percent: Number(thresholdForm.percent)
  })
  thresholdForm.minNetto = 0
  thresholdForm.percent = 0
}

const removeThreshold = (index) => {
  settings.discounts.thresholds.splice(index, 1)
}

const addCoupon = () => {
  if (!couponForm.code || !couponForm.percent) return
  settings.discounts.coupons.push({
    code: couponForm.code.toUpperCase(),
    percent: Number(couponForm.percent)
  })
  couponForm.code = ''
  couponForm.percent = 0
}

const removeCoupon = (index) => {
  settings.discounts.coupons.splice(index, 1)
}

const saveSettings = async () => {
  ensureDefaults()
  try {
    const payload = JSON.parse(JSON.stringify(toRaw(settings)))
    await saveSettingsToStore(payload)
    alert('Ustawienia zapisane!')
    window.dispatchEvent(new Event('permissions-updated'))
    window.dispatchEvent(new Event('ui-updated'))
  } catch (error) {
    alert('Nie udało się zapisać ustawień. Spróbuj ponownie.')
  }
}

const autoSave = () => {
  if (isLoading.value) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      const payload = JSON.parse(JSON.stringify(toRaw(settings)))
      await saveSettingsToStore(payload)
      window.dispatchEvent(new Event('permissions-updated'))
      window.dispatchEvent(new Event('ui-updated'))
    } catch {
      // ignore autosave errors
    }
  }, 400)
}

const onUserRoleChange = async (email, role) => {
  await updateUserRole(email, role)
  loadUsers()
}

const handleLogoUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    alert('Proszę wybrać plik PNG lub JPG')
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    settings.template.logo = reader.result
  }
  reader.readAsDataURL(file)
}

const goHome = () => {
  router.push({ name: 'home' })
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  loadSettings()
  loadUsers()
})

watch(settings, autoSave, { deep: true })
</script>

<style src="./Settings.css"></style>
