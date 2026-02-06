import { apiGet, apiPut } from '@/services/api'
import { setItem } from '@/services/secureStore'

const collectionMap = [
  { key: 'documents', path: '/documents' },
  { key: 'contacts', path: '/contacts' },
  { key: 'inventory', path: '/inventory' },
  { key: 'warehouses', path: '/warehouses' },
  { key: 'priceLists', path: '/price-lists' },
  { key: 'salesOrders', path: '/sales-orders' },
  { key: 'purchaseOrders', path: '/purchase-orders' },
  { key: 'returns', path: '/returns' },
  { key: 'reservations', path: '/reservations' },
  { key: 'pickingTasks', path: '/picking' }
]

export const syncFromBackend = async () => {
  try {
    const settings = await apiGet('/settings')
    if (settings) {
      await setItem('settings', settings)
    }
  } catch {
    // ignore
  }

  try {
    const users = await apiGet('/users')
    if (Array.isArray(users)) {
      await setItem('fakturex_users', users)
    }
  } catch {
    // ignore
  }

  await Promise.all(
    collectionMap.map(async ({ key, path }) => {
      try {
        const list = await apiGet(`${path}/bulk`)
        if (Array.isArray(list)) {
          await setItem(key, list)
        }
      } catch {
        // ignore
      }
    })
  )
}

export const pushSettings = async (settings) => {
  try {
    await apiPut('/settings', settings)
  } catch {
    // ignore
  }
}

export const pushCollection = async (key, list) => {
  const mapping = collectionMap.find((item) => item.key === key)
  if (!mapping) return
  try {
    await apiPut(`${mapping.path}/bulk`, list)
  } catch {
    // ignore
  }
}
