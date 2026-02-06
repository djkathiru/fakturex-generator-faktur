import { getSettings, saveSettings } from './settings'

export const getPermissionsMatrix = () => {
  const settings = getSettings()
  return settings.permissions || {}
}

export const savePermissionsMatrix = async (matrix) => {
  const settings = getSettings()
  const next = { ...settings, permissions: matrix }
  await saveSettings(next)
  return next.permissions
}

export function can(permissionKey, userRole, matrix) {
  if (!permissionKey) return true
  if (!userRole) return false
  const perms = matrix?.[userRole]
  return !!perms?.[permissionKey]
}

export function getAllPermissionKeys(matrix) {
  const roles = Object.keys(matrix || {})
  const keys = new Set()
  roles.forEach((role) => {
    const perms = matrix?.[role] || {}
    Object.keys(perms).forEach((key) => keys.add(key))
  })
  return Array.from(keys)
}
