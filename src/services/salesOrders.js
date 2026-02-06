import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const SALES_ORDERS_KEY = 'salesOrders'

export const getSalesOrders = () => {
  return getItem(SALES_ORDERS_KEY, []) || []
}

const saveSalesOrders = (orders) => {
  setItem(SALES_ORDERS_KEY, orders)
  pushCollection(SALES_ORDERS_KEY, orders)
}

export const addSalesOrder = (order) => {
  const list = getSalesOrders()
  const newOrder = { id: crypto.randomUUID(), status: 'draft', ...order }
  list.unshift(newOrder)
  saveSalesOrders(list)
  return list
}

export const updateSalesOrder = (id, update) => {
  const list = getSalesOrders().map((order) => (order.id === id ? { ...order, ...update } : order))
  saveSalesOrders(list)
  return list
}

export const removeSalesOrder = (id) => {
  const list = getSalesOrders().filter((order) => order.id !== id)
  saveSalesOrders(list)
  return list
}
