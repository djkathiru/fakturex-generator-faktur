const API_BASE = import.meta.env.VITE_API_URL || ''

const getToken = () => localStorage.getItem('apiToken')
const getCompanyId = () => localStorage.getItem('companyId')

export const hasApiBase = () => !!API_BASE

export const hasBackendConfig = () => !!API_BASE && !!getToken() && !!getCompanyId()

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'X-Company-Id': getCompanyId() || ''
})

export const apiUrl = (path) => `${API_BASE}${path}`

export const apiFetch = async (path, options = {}) => {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeaders(),
    ...(options.headers || {})
  }

  const response = await fetch(apiUrl(path), { ...options, headers })
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || 'Błąd komunikacji z API')
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}
