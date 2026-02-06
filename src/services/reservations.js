import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const RESERVATIONS_KEY = 'reservations'

export const getReservations = () => {
  return getItem(RESERVATIONS_KEY, []) || []
}

const saveReservations = (reservations) => {
  setItem(RESERVATIONS_KEY, reservations)
  pushCollection(RESERVATIONS_KEY, reservations)
}

export const addReservation = (reservation) => {
  const list = getReservations()
  const newReservation = { id: crypto.randomUUID(), status: 'active', ...reservation }
  list.unshift(newReservation)
  saveReservations(list)
  return list
}

export const updateReservation = (id, update) => {
  const list = getReservations().map((item) => (item.id === id ? { ...item, ...update } : item))
  saveReservations(list)
  return list
}

export const removeReservation = (id) => {
  const list = getReservations().filter((item) => item.id !== id)
  saveReservations(list)
  return list
}
