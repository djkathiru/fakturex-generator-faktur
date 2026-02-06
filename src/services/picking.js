import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const PICKING_KEY = 'pickingTasks'

export const getPickingTasks = () => {
  return getItem(PICKING_KEY, []) || []
}

const savePickingTasks = (tasks) => {
  setItem(PICKING_KEY, tasks)
  pushCollection(PICKING_KEY, tasks)
}

export const addPickingTask = (task) => {
  const list = getPickingTasks()
  const newTask = { id: crypto.randomUUID(), status: 'open', ...task }
  list.unshift(newTask)
  savePickingTasks(list)
  return list
}

export const updatePickingTask = (id, update) => {
  const list = getPickingTasks().map((task) => (task.id === id ? { ...task, ...update } : task))
  savePickingTasks(list)
  return list
}

export const removePickingTask = (id) => {
  const list = getPickingTasks().filter((task) => task.id !== id)
  savePickingTasks(list)
  return list
}
