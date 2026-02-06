import express from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
  const db = getDb()
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users').all()
  res.json(users)
})

router.post('/', (req, res) => {
  const { email, name, role, password } = req.body || {}
  if (!email || !name || !role || !password) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  const db = getDb()
  const hash = bcrypt.hashSync(password, 10)
  const now = new Date().toISOString()

  try {
    const result = db
      .prepare('INSERT INTO users (email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(email, name, role, hash, now)
    return res.status(201).json({ id: result.lastInsertRowid, email, name, role, created_at: now })
  } catch (error) {
    return res.status(400).json({ error: 'User already exists' })
  }
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const { email, name, role, password } = req.body || {}
  const db = getDb()

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
  if (!user) return res.status(404).json({ error: 'Not found' })

  if (password) {
    const hash = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET email = ?, name = ?, role = ?, password_hash = ? WHERE id = ?').run(
      email,
      name,
      role,
      hash,
      id
    )
  } else {
    db.prepare('UPDATE users SET email = ?, name = ?, role = ? WHERE id = ?').run(
      email,
      name,
      role,
      id
    )
  }

  return res.json({ id, email, name, role })
})

router.delete('/:id', (req, res) => {
  const { id } = req.params
  const db = getDb()
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  return res.status(204).send()
})

export default router
