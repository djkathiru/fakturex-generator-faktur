import { getItem, setItem, removeItem } from '@/services/secureStore'
import { apiUrl, hasApiBase } from '@/services/api'

const AUTH_KEY = 'fakturex_auth'
const USERS_KEY = 'fakturex_users'

const demoUsers = [
  {
    email: 'admin@fakturex.pl',
    password: 'admin123',
    role: 'OWNER',
    name: 'Właściciel'
  },
  {
    email: 'ksiegowy@fakturex.pl',
    password: 'demo123',
    role: 'ACCOUNTANT',
    name: 'Księgowy'
  },
  {
    email: 'podglad@fakturex.pl',
    password: 'demo123',
    role: 'VIEWER',
    name: 'Podgląd'
  }
]

const legacyRoleMap = {
  admin: 'OWNER',
  accountant: 'ACCOUNTANT',
  sales: 'VIEWER',
  warehouse: 'VIEWER'
}

const normalizeRole = (role) => legacyRoleMap[role] || role

const normalizeSession = (session) => {
  if (!session?.user?.role) return session
  const nextRole = normalizeRole(session.user.role)
  if (nextRole === session.user.role) return session
  return { ...session, user: { ...session.user, role: nextRole } }
}

const readSession = () => normalizeSession(getItem(AUTH_KEY, null))

const writeSession = (session) => {
  setItem(AUTH_KEY, session)
}

export const getUsers = () => {
  const stored = getItem(USERS_KEY, null)
  if (!Array.isArray(stored) || stored.length === 0) {
    return structuredClone(demoUsers)
  }
  return stored.map((user) => ({ ...user, role: normalizeRole(user.role) }))
}

export const saveUsers = async (users) => {
  await setItem(USERS_KEY, users)
}

export const updateUserRole = async (email, role) => {
  const users = getUsers()
  const index = users.findIndex((user) => user.email === email)
  if (index === -1) return users
  users[index] = { ...users[index], role }
  await saveUsers(users)
  return users
}

export const getSession = () => readSession()

export const isAuthenticated = () => !!readSession()?.user

export const hasRole = (roles = []) => {
  if (!roles || roles.length === 0) return true
  const role = readSession()?.user?.role
  return !!role && roles.includes(role)
}

const storeBackendSession = async (token, user) => {
  localStorage.setItem('apiToken', token)

  const companiesResponse = await fetch(apiUrl('/companies'), {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!companiesResponse.ok) {
    throw new Error('Nie udało się pobrać firm użytkownika.')
  }

  const companies = await companiesResponse.json()
  let companyId = localStorage.getItem('companyId')
  if (!companyId || !companies.some((company) => company.id === companyId)) {
    if (companies.length > 0) {
      companyId = companies[0].id
    } else {
      const createResponse = await fetch(apiUrl('/companies'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: user.name || user.email || 'Moja firma' })
      })

      if (!createResponse.ok) {
        throw new Error('Nie udało się utworzyć firmy.')
      }

      const created = await createResponse.json()
      companyId = created.id
    }
  }

  localStorage.setItem('companyId', companyId)
}

export const login = async (email, password) => {
  if (hasApiBase()) {
    const response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error('Nieprawidłowy e-mail lub hasło.')
    }

    const payload = await response.json()
    await storeBackendSession(payload.token, payload.user)

    const session = {
      user: {
        name: payload.user.name,
        email: payload.user.email,
        role: payload.user.role
      },
      token: payload.token
    }

    writeSession(session)
    return session
  }

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

export const logout = () => {
  removeItem(AUTH_KEY)
  localStorage.removeItem('apiToken')
  localStorage.removeItem('companyId')
}

export const getDemoUsers = () =>
  getUsers().map(({ email, role, name }) => ({ email, role, name }))
