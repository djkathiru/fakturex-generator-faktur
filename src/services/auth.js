import { getItem, setItem, removeItem } from '@/services/secureStore'
import { apiPost, apiPut } from '@/services/api'
import { syncFromBackend } from '@/services/sync'

const AUTH_KEY = 'fakturex_auth'
const USERS_KEY = 'fakturex_users'

const demoUsers = [
  {
    email: 'admin@fakturex.pl',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator'
  },
  {
    email: 'ksiegowy@fakturex.pl',
    password: 'demo123',
    role: 'accountant',
    name: 'Księgowy'
  },
  {
    email: 'magazyn@fakturex.pl',
    password: 'demo123',
    role: 'warehouse',
    name: 'Magazynier'
  },
  {
    email: 'sprzedaz@fakturex.pl',
    password: 'demo123',
    role: 'sales',
    name: 'Sprzedawca'
  }
]

const readSession = () => getItem(AUTH_KEY, null)

const writeSession = (session) => {
  setItem(AUTH_KEY, session)
}

export const getUsers = () => {
  const stored = getItem(USERS_KEY, null)
  if (!Array.isArray(stored) || stored.length === 0) {
    return structuredClone(demoUsers)
  }
  return stored
}

export const saveUsers = async (users) => {
  await setItem(USERS_KEY, users)
}

export const updateUserRole = async (userIdOrEmail, role) => {
  const users = getUsers()
  const index = users.findIndex(
    (user) => user.id === userIdOrEmail || user.email === userIdOrEmail
  )
  if (index === -1) return users

  const updated = { ...users[index], role }
  users[index] = updated
  await saveUsers(users)

  if (updated.id) {
    try {
      await apiPut(`/users/${updated.id}`, updated)
    } catch {
      // ignore api errors
    }
  }

  return users
}

export const getSession = () => readSession()

export const isAuthenticated = () => !!readSession()?.user

export const hasRole = (roles = []) => {
  if (!roles || roles.length === 0) return true
  const role = readSession()?.user?.role
  return !!role && roles.includes(role)
}

export const login = async (email, password) => {
  try {
    const response = await apiPost('/auth/login', { email, password })
    const session = { user: response.user, token: response.token }
    writeSession(session)
    await setItem(USERS_KEY, [])
    await syncFromBackend()
    return session
  } catch (error) {
    const users = getUsers()
    const matched = users.find((user) => user.email === email && user.password === password)
    if (!matched) {
      throw new Error('Nieprawidłowy e-mail lub hasło.')
    }
    const session = {
      user: {
        name: matched.name,
        email: matched.email,
        role: matched.role
      },
      token: `demo-${Date.now()}`
    }
    writeSession(session)
    return session
  }
}

export const logout = () => {
  removeItem(AUTH_KEY)
}

export const getDemoUsers = () =>
  getUsers().map(({ email, role, name }) => ({ email, role, name }))
