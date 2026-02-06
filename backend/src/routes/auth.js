import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'

const router = express.Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  const db = getDb()
  const user = db
    .prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?')
    .get(email)

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'change-me',
    { expiresIn: '7d' }
  )

  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  })
})

router.get('/me', (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me')
    return res.json({ user: decoded })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
