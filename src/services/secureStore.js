import { openDB } from 'idb'

const DB_NAME = 'fakturex-db'
const STORE_NAME = 'kv'
const KEY_STORAGE = 'fakturex_master_key'
const SALT_STORAGE = 'fakturex_salt'

let dbInstance = null
let cache = new Map()
let cryptoKey = null

const getMasterKey = () => {
  const existing = localStorage.getItem(KEY_STORAGE)
  if (existing) return existing
  const generated = 'fakturex-local-key'
  localStorage.setItem(KEY_STORAGE, generated)
  return generated
}

const getSalt = () => {
  const existing = localStorage.getItem(SALT_STORAGE)
  if (existing) return existing
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoded = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('')
  localStorage.setItem(SALT_STORAGE, encoded)
  return encoded
}

const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

const getCryptoKey = async () => {
  if (cryptoKey) return cryptoKey
  const master = getMasterKey()
  const salt = hexToBytes(getSalt())
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(master),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  return cryptoKey
}

const encryptValue = async (value) => {
  const key = await getCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(value))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext))
  }
}

const decryptValue = async (payload) => {
  if (!payload) return null
  const key = await getCryptoKey()
  const iv = new Uint8Array(payload.iv)
  const data = new Uint8Array(payload.data)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return JSON.parse(new TextDecoder().decode(decrypted))
}

export const initStore = async () => {
  dbInstance = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })

  const keys = await dbInstance.getAllKeys(STORE_NAME)
  const entries = await Promise.all(keys.map((key) => dbInstance.get(STORE_NAME, key)))
  const decoded = await Promise.all(entries.map((entry) => decryptValue(entry)))

  cache = new Map()
  keys.forEach((key, index) => {
    cache.set(key, decoded[index])
  })
}

export const getItem = (key, fallback = null) => {
  if (!cache.has(key)) return fallback
  return cache.get(key)
}

export const setItem = async (key, value) => {
  const encrypted = await encryptValue(value)
  await dbInstance.put(STORE_NAME, encrypted, key)
  cache.set(key, value)
}

export const removeItem = async (key) => {
  await dbInstance.delete(STORE_NAME, key)
  cache.delete(key)
}

export const getAllKeys = () => Array.from(cache.keys())

export const rotateKey = async (newKey) => {
  const current = getMasterKey()
  if (current === newKey) return

  const keys = getAllKeys()
  const values = keys.map((key) => cache.get(key))
  cryptoKey = null
  localStorage.setItem(KEY_STORAGE, newKey)
  localStorage.removeItem(SALT_STORAGE)
  cache.clear()

  await initStore()
  await Promise.all(keys.map((key, index) => setItem(key, values[index])))
}

export const getMasterKeyInfo = () => getMasterKey()
