import express from 'express'
import { nanoid } from 'nanoid'
import { getDb } from '../db.js'

const tableMap = {
  documents: 'documents',
  contacts: 'contacts',
  inventory: 'inventory',
  warehouses: 'warehouses',
  priceLists: 'price_lists',
  salesOrders: 'sales_orders',
  purchaseOrders: 'purchase_orders',
  returns: 'returns',
  reservations: 'reservations',
  picking: 'picking',
  payments: 'payments'
}

const getTable = (name) => tableMap[name]

const listItems = (table) => {
  const db = getDb()
  return db.prepare(`SELECT id, data, created_at, updated_at FROM ${table}`).all().map((row) => ({
    id: row.id,
    ...JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

const getItem = (table, id) => {
  const db = getDb()
  const row = db.prepare(`SELECT id, data, created_at, updated_at FROM ${table} WHERE id = ?`).get(id)
  if (!row) return null
  return {
    id: row.id,
    ...JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

const createItem = (table, payload) => {
  const db = getDb()
  const id = payload.id || nanoid()
  const now = new Date().toISOString()
  db.prepare(`INSERT INTO ${table} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`).run(
    id,
    JSON.stringify(payload),
    now,
    now
  )
  return getItem(table, id)
}

const updateItem = (table, id, payload) => {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare(`UPDATE ${table} SET data = ?, updated_at = ? WHERE id = ?`).run(
    JSON.stringify(payload),
    now,
    id
  )
  return getItem(table, id)
}

const deleteItem = (table, id) => {
  const db = getDb()
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
}

export const createCollectionRouter = (name) => {
  const table = getTable(name)
  if (!table) throw new Error(`Unknown collection: ${name}`)
  const router = express.Router()

  router.get('/bulk', (req, res) => {
    res.json(listItems(table))
  })

  router.put('/bulk', (req, res) => {
    const payload = req.body
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Expected array' })
    }

    const db = getDb()
    const now = new Date().toISOString()
    const insert = db.prepare(`INSERT INTO ${table} (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)`)
    const replaceAll = db.transaction((items) => {
      db.prepare(`DELETE FROM ${table}`).run()
      items.forEach((item) => {
        const id = item.id || nanoid()
        insert.run(id, JSON.stringify(item), now, now)
      })
    })

    replaceAll(payload)
    return res.json(listItems(table))
  })

  router.get('/', (req, res) => {
    res.json(listItems(table))
  })

  router.get('/:id', (req, res) => {
    const item = getItem(table, req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.json(item)
  })

  router.post('/', (req, res) => {
    const payload = req.body || {}
    const item = createItem(table, payload)
    return res.status(201).json(item)
  })

  router.put('/:id', (req, res) => {
    const payload = req.body || {}
    const existing = getItem(table, req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const item = updateItem(table, req.params.id, payload)
    return res.json(item)
  })

  router.delete('/:id', (req, res) => {
    const existing = getItem(table, req.params.id)
    if (!existing) return res.status(404).json({ error: 'Not found' })
    deleteItem(table, req.params.id)
    return res.status(204).send()
  })

  return router
}
