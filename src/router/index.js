import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/components/Index.vue'
import InvoiceForm from '@/components/InvoiceForm.vue'
import InvoicePreviewPage from '@/components/InvoicePreviewPage.vue'
import Settings from '@/components/Settings.vue'
import InvoiceList from '@/components/InvoiceList.vue'  // Import nowego komponentu
import Login from '@/components/Login.vue'
import Contacts from '@/components/Contacts.vue'
import Warehouse from '@/components/Warehouse.vue'
import Payments from '@/components/Payments.vue'
import Reports from '@/components/Reports.vue'
import SalesOrders from '@/components/SalesOrders.vue'
import PurchaseOrders from '@/components/PurchaseOrders.vue'
import Picking from '@/components/Picking.vue'
import Returns from '@/components/Returns.vue'
import PriceLists from '@/components/PriceLists.vue'
import { getSession, isAuthenticated, hasRole } from '@/services/auth'
import { can, getPermissionsMatrix } from '@/services/permissions'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Index,
    meta: { requiresAuth: true }
  },
  {
    path: '/invoice-form',
    name: 'invoice-form',
    component: InvoiceForm,
    meta: { requiresAuth: true, permission: 'createDocuments' }
  },
  {
    path: '/preview',
    name: 'InvoicePreview',
    component: InvoicePreviewPage,
    meta: { requiresAuth: true, permission: 'manageInvoices' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { requiresAuth: true, roles: ['admin'], permission: 'manageSettings' }
  },
  {
    path: '/invoice-list',
    name: 'invoice-list',
    component: InvoiceList,  // Dodanie trasy do listy faktur
    meta: { requiresAuth: true, permission: 'manageDocuments' }
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: Contacts,
    meta: { requiresAuth: true, roles: ['admin', 'accountant', 'sales'], permission: 'manageContacts' }
  },
  {
    path: '/warehouse',
    name: 'warehouse',
    component: Warehouse,
    meta: { requiresAuth: true, roles: ['admin', 'warehouse'], permission: 'manageWarehouse' }
  },
  {
    path: '/payments',
    name: 'payments',
    component: Payments,
    meta: { requiresAuth: true, roles: ['admin', 'accountant', 'sales'], permission: 'managePayments' }
  },
  {
    path: '/reports',
    name: 'reports',
    component: Reports,
    meta: { requiresAuth: true, roles: ['admin', 'accountant'], permission: 'manageReports' }
  },
  {
    path: '/sales-orders',
    name: 'sales-orders',
    component: SalesOrders,
    meta: { requiresAuth: true, roles: ['admin', 'sales'], permission: 'manageSalesOrders' }
  },
  {
    path: '/purchase-orders',
    name: 'purchase-orders',
    component: PurchaseOrders,
    meta: { requiresAuth: true, roles: ['admin', 'warehouse'], permission: 'managePurchaseOrders' }
  },
  {
    path: '/picking',
    name: 'picking',
    component: Picking,
    meta: { requiresAuth: true, roles: ['admin', 'warehouse'], permission: 'managePicking' }
  },
  {
    path: '/returns',
    name: 'returns',
    component: Returns,
    meta: { requiresAuth: true, roles: ['admin', 'sales', 'warehouse'], permission: 'manageReturns' }
  },
  {
    path: '/price-lists',
    name: 'price-lists',
    component: PriceLists,
    meta: { requiresAuth: true, roles: ['admin', 'accountant', 'sales'], permission: 'managePriceLists' }
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (to.name === 'login' && isAuthenticated()) {
    return { name: 'home' }
  }

  if (to.meta?.requiresAuth && !isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta?.roles && !hasRole(to.meta.roles)) {
    return { name: 'home' }
  }

  if (to.meta?.permission) {
    const role = getSession()?.user?.role
    const matrix = getPermissionsMatrix()
    if (!can(to.meta.permission, role, matrix)) {
      return { name: 'home' }
    }
  }
})

export default router
