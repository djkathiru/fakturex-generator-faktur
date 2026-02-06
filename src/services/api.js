import { getItem } from '@/services/secureStore'

const AUTH_KEY = 'fakturex_auth'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const buildHeaders = () => {
  const session = getItem(AUTH_KEY, null)
  const headers = { 'Content-Type': 'application/json' }
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`
  }
  return headers
}

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...buildHeaders(), ...(options.headers || {}) }
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const data = await response.json()
      message = data.error || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const apiGet = (path) => request(path)
export const apiPost = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPut = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) })
export const apiDelete = (path) => request(path, { method: 'DELETE' })
