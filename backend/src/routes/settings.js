import express from 'express'
import { getDb } from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT data FROM settings WHERE id = 1').get()
  if (!row) return res.json({})
  return res.json(JSON.parse(row.data))
})

router.put('/', (req, res) => {
  const payload = req.body || {}
  const db = getDb()
  const now = new Date().toISOString()
  const data = JSON.stringify(payload)

  const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get()
  if (existing) {
    db.prepare('UPDATE settings SET data = ?, updated_at = ? WHERE id = 1').run(data, now)
  } else {
    db.prepare('INSERT INTO settings (id, data, updated_at) VALUES (1, ?, ?)').run(data, now)
  }

  return res.json(payload)
})

export default router
