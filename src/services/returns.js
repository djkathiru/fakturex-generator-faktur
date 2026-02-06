import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const RETURNS_KEY = 'returns'

export const getReturns = () => {
  return getItem(RETURNS_KEY, []) || []
}

const saveReturns = (returnsList) => {
  setItem(RETURNS_KEY, returnsList)
  pushCollection(RETURNS_KEY, returnsList)
}

export const addReturn = (entry) => {
  const list = getReturns()
  const newEntry = { id: crypto.randomUUID(), status: 'open', ...entry }
  list.unshift(newEntry)
  saveReturns(list)
  return list
}

export const updateReturn = (id, update) => {
  const list = getReturns().map((entry) => (entry.id === id ? { ...entry, ...update } : entry))
  saveReturns(list)
  return list
}

export const removeReturn = (id) => {
  const list = getReturns().filter((entry) => entry.id !== id)
  saveReturns(list)
  return list
}
