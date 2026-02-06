import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const WAREHOUSES_KEY = 'warehouses'

const createDefaultWarehouse = () => ({
  id: crypto.randomUUID(),
  name: 'Magazyn główny',
  code: 'MG',
  location: ''
})

export const getWarehouses = () => {
  const cached = getItem(WAREHOUSES_KEY, null)
  if (cached?.length) return cached

  const defaults = [createDefaultWarehouse()]
  setItem(WAREHOUSES_KEY, defaults)
  return defaults
}

const saveWarehouses = (warehouses) => {
  setItem(WAREHOUSES_KEY, warehouses)
  pushCollection(WAREHOUSES_KEY, warehouses)
}

export const addWarehouse = (warehouse) => {
  const list = getWarehouses()
  const newWarehouse = { id: crypto.randomUUID(), ...warehouse }
  list.unshift(newWarehouse)
  saveWarehouses(list)
  return list
}

export const updateWarehouse = (id, update) => {
  const list = getWarehouses().map((item) => (item.id === id ? { ...item, ...update } : item))
  saveWarehouses(list)
  return list
}

export const removeWarehouse = (id) => {
  const list = getWarehouses().filter((item) => item.id !== id)
  saveWarehouses(list.length ? list : [createDefaultWarehouse()])
  return list.length ? list : getWarehouses()
}
