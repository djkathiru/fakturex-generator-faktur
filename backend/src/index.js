import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import settingsRoutes from './routes/settings.js'
import { createCollectionRouter } from './routes/collection.js'
import { authRequired } from './middleware/auth.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(morgan('dev'))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/auth', authRoutes)
app.use('/users', authRequired, userRoutes)
app.use('/settings', authRequired, settingsRoutes)

app.use('/documents', authRequired, createCollectionRouter('documents'))
app.use('/contacts', authRequired, createCollectionRouter('contacts'))
app.use('/inventory', authRequired, createCollectionRouter('inventory'))
app.use('/warehouses', authRequired, createCollectionRouter('warehouses'))
app.use('/price-lists', authRequired, createCollectionRouter('priceLists'))
app.use('/sales-orders', authRequired, createCollectionRouter('salesOrders'))
app.use('/purchase-orders', authRequired, createCollectionRouter('purchaseOrders'))
app.use('/returns', authRequired, createCollectionRouter('returns'))
app.use('/reservations', authRequired, createCollectionRouter('reservations'))
app.use('/picking', authRequired, createCollectionRouter('picking'))
app.use('/payments', authRequired, createCollectionRouter('payments'))

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  console.log(`Fakturex backend running on http://localhost:${PORT}`)
})
