import { getWarehouses } from '@/services/warehouses'
import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const INVENTORY_KEY = 'inventory'

export const getInventory = () => {
  const cached = getItem(INVENTORY_KEY, null)
  if (cached) return cached

  const [defaultWarehouse] = getWarehouses()
  const legacy = localStorage.getItem('products')
  if (!legacy) return []
  const legacyItems = JSON.parse(legacy).map((item) => ({
    id: crypto.randomUUID(),
    name: item.name,
    sku: '',
    unit: 'szt.',
    stock: 0,
    price: Number(item.price) || 0,
    vat: String(item.vat ?? '23'),
    warehouseId: defaultWarehouse?.id || '',
    location: '',
    batches: [],
    minStock: 0
  }))
  saveInventory(legacyItems)
  return legacyItems
}

export const saveInventory = (items) => {
  setItem(INVENTORY_KEY, items)
  pushCollection(INVENTORY_KEY, items)
}

export const addInventoryItem = (item) => {
  const items = getInventory()
  const newItem = { id: crypto.randomUUID(), ...item }
  items.unshift(newItem)
  saveInventory(items)
  return items
}

export const updateInventoryItem = (id, update) => {
  const items = getInventory().map((item) =>
    item.id === id ? { ...item, ...update } : item
  )
  saveInventory(items)
  return items
}

export const removeInventoryItem = (id) => {
  const items = getInventory().filter((item) => item.id !== id)
  saveInventory(items)
  return items
}

const normalizeItem = (item) => ({
  ...item,
  batches: Array.isArray(item.batches) ? item.batches : []
})

const consumeBatchesFefo = (item, quantity) => {
  const normalized = normalizeItem(item)
  if (!normalized.batches.length) return normalized.batches

  const sorted = [...normalized.batches].sort((a, b) => {
    if (!a.expiryDate) return 1
    if (!b.expiryDate) return -1
    return a.expiryDate.localeCompare(b.expiryDate)
  })

  let remaining = quantity
  const updatedBatches = []

  sorted.forEach((batch) => {
    if (remaining <= 0) {
      updatedBatches.push(batch)
      return
    }
    if (batch.quantity > remaining) {
      updatedBatches.push({ ...batch, quantity: batch.quantity - remaining })
      remaining = 0
    } else {
      remaining -= batch.quantity
    }
  })

  return updatedBatches
}

export const adjustInventoryStock = (itemId, delta) => {
  const items = getInventory()
  const item = items.find((entry) => entry.id === itemId)
  if (!item) return items

  const nextStock = Math.max(0, Number(item.stock) + Number(delta))
  const updated = {
    ...item,
    stock: nextStock,
    batches: delta < 0 ? consumeBatchesFefo(item, Math.abs(delta)) : item.batches
  }

  return updateInventoryItem(itemId, updated)
}
