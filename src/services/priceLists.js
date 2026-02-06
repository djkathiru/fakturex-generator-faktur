import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const PRICE_LISTS_KEY = 'priceLists'

export const getPriceLists = () => {
  return getItem(PRICE_LISTS_KEY, []) || []
}

const savePriceLists = (lists) => {
  setItem(PRICE_LISTS_KEY, lists)
  pushCollection(PRICE_LISTS_KEY, lists)
}

export const addPriceList = (list) => {
  const lists = getPriceLists()
  const newList = { id: crypto.randomUUID(), items: [], ...list }
  lists.unshift(newList)
  savePriceLists(lists)
  return lists
}

export const updatePriceList = (id, update) => {
  const lists = getPriceLists().map((list) => (list.id === id ? { ...list, ...update } : list))
  savePriceLists(lists)
  return lists
}

export const removePriceList = (id) => {
  const lists = getPriceLists().filter((list) => list.id !== id)
  savePriceLists(lists)
  return lists
}
