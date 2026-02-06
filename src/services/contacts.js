import { getItem, setItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const CONTACTS_KEY = 'contacts'

export const getContacts = () => {
  return getItem(CONTACTS_KEY, []) || []
}

const saveContacts = (contacts) => {
  setItem(CONTACTS_KEY, contacts)
  pushCollection(CONTACTS_KEY, contacts)
}

export const addContact = (contact) => {
  const contacts = getContacts()
  const newContact = { id: crypto.randomUUID(), ...contact }
  contacts.unshift(newContact)
  saveContacts(contacts)
  return contacts
}

export const updateContact = (id, update) => {
  const contacts = getContacts().map((contact) =>
    contact.id === id ? { ...contact, ...update } : contact
  )
  saveContacts(contacts)
  return contacts
}

export const removeContact = (id) => {
  const contacts = getContacts().filter((contact) => contact.id !== id)
  saveContacts(contacts)
  return contacts
}
