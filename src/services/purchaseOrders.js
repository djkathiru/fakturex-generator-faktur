import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const PURCHASE_ORDERS_KEY = 'purchaseOrders'

export const getPurchaseOrders = () => {
  return getItem(PURCHASE_ORDERS_KEY, []) || []
}

const savePurchaseOrders = (orders) => {
  setItem(PURCHASE_ORDERS_KEY, orders)
  pushCollection(PURCHASE_ORDERS_KEY, orders)
}

export const addPurchaseOrder = (order) => {
  const list = getPurchaseOrders()
  const newOrder = { id: crypto.randomUUID(), status: 'draft', ...order }
  list.unshift(newOrder)
  savePurchaseOrders(list)
  return list
}

export const updatePurchaseOrder = (id, update) => {
  const list = getPurchaseOrders().map((order) => (order.id === id ? { ...order, ...update } : order))
  savePurchaseOrders(list)
  return list
}

export const removePurchaseOrder = (id) => {
  const list = getPurchaseOrders().filter((order) => order.id !== id)
  savePurchaseOrders(list)
  return list
}
