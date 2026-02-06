import jwt from 'jsonwebtoken'

export const authRequired = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Missing token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me')
    req.user = decoded
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
