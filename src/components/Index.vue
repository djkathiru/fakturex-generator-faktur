<template>
  <div class="index-container">
    <div class="header">
      <h1 class="app-title">Fakturex</h1>
      <div class="header-actions">
        <div class="buttons-container">
          <button v-if="canAccess('manageSettings')" @click="goToSettings" class="settings-btn">
            <i class="fa fa-cogs"></i> Ustawienia
          </button>
          <button v-if="canAccess('manageDocuments')" @click="goToInvoiceList" class="invoice-list-btn">
            <i class="fa fa-list"></i> Rejestr dokumentów
          </button>
          <button v-if="canAccess('manageContacts')" @click="goToContacts" class="contacts-btn">
            <i class="fa fa-address-book"></i> Kontrahenci
          </button>
          <button v-if="canAccess('manageWarehouse')" @click="goToWarehouse" class="warehouse-btn">
            <i class="fa fa-cubes"></i> Magazyn
          </button>
          <button v-if="canAccess('managePayments')" @click="goToPayments" class="payments-btn">
            <i class="fa fa-credit-card"></i> Płatności
          </button>
          <button v-if="canAccess('manageReports')" @click="goToReports" class="reports-btn">
            <i class="fa fa-chart-line"></i> Raporty
          </button>
          <button v-if="canAccess('manageSalesOrders')" @click="goToSalesOrders" class="sales-orders-btn">
            <i class="fa fa-shopping-cart"></i> Zam. sprzedaży
          </button>
          <button v-if="canAccess('managePurchaseOrders')" @click="goToPurchaseOrders" class="purchase-orders-btn">
            <i class="fa fa-truck"></i> Zam. zakupu
          </button>
          <button v-if="canAccess('managePicking')" @click="goToPicking" class="picking-btn">
            <i class="fa fa-boxes"></i> Picking
          </button>
          <button v-if="canAccess('manageReturns')" @click="goToReturns" class="returns-btn">
            <i class="fa fa-rotate-left"></i> Zwroty
          </button>
          <button v-if="canAccess('managePriceLists')" @click="goToPriceLists" class="price-lists-btn">
            <i class="fa fa-tags"></i> Cenniki
          </button>
        </div>
        <div v-if="user" class="user-area">
          <div class="user-info">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-role">{{ roleLabels[user.role] }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout">Wyloguj</button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <button v-if="canAccess('createDocuments')" @click="goToInvoiceForm" class="invoice-btn">
        Nowy dokument
      </button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSession, logout } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'

const router = useRouter()
const user = ref(getSession()?.user ?? null)
const permissionMatrix = ref(getPermissionsMatrix())

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const refreshPermissions = () => {
  permissionMatrix.value = getPermissionsMatrix()
}

const canAccess = (permissionKey) => {
  return can(permissionKey, user.value?.role, permissionMatrix.value)
}

const goToSettings = () => {
  router.push({ name: 'settings' })
}

const goToInvoiceList = () => {
  router.push({ name: 'invoice-list' })
}

const goToInvoiceForm = () => {
  router.push({ name: 'invoice-form' })
}

const goToContacts = () => {
  router.push({ name: 'contacts' })
}

const goToWarehouse = () => {
  router.push({ name: 'warehouse' })
}

const goToPayments = () => {
  router.push({ name: 'payments' })
}

const goToReports = () => {
  router.push({ name: 'reports' })
}

const goToSalesOrders = () => {
  router.push({ name: 'sales-orders' })
}

const goToPurchaseOrders = () => {
  router.push({ name: 'purchase-orders' })
}

const goToPicking = () => {
  router.push({ name: 'picking' })
}

const goToReturns = () => {
  router.push({ name: 'returns' })
}

const goToPriceLists = () => {
  router.push({ name: 'price-lists' })
}

const handleLogout = () => {
  logout()
  router.push({ name: 'login' })
}

onMounted(() => {
  window.addEventListener('permissions-updated', refreshPermissions)
})

onBeforeUnmount(() => {
  window.removeEventListener('permissions-updated', refreshPermissions)
})
</script>

<style src="./Index.css"></style>
