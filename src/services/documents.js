import { getItem, setItem, removeItem } from '@/services/secureStore'
import { pushCollection } from '@/services/sync'

const DOCUMENTS_KEY = 'documents'
const COUNTER_KEY = 'documentCounters'

const defaultPrefixes = {
  invoice: 'FV',
  proforma: 'PF',
  advance: 'FZ',
  final: 'FK',
  correction: 'KOR',
  receipt: 'PAR',
  pz: 'PZ',
  wz: 'WZ',
  rw: 'RW',
  mm: 'MM',
  inw: 'INW',
  so: 'SO',
  po: 'PO',
  rma: 'RMA',
  expense: 'WYD'
}

const getCounters = () => {
  return getItem(COUNTER_KEY, {}) || {}
}

const saveCounters = (counters) => {
  setItem(COUNTER_KEY, counters)
}

const formatNumber = (prefix, seq, date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${prefix}/${String(seq).padStart(3, '0')}/${month}/${year}`
}

const resolvePrefix = (type, settings) => {
  const map = {
    invoice: settings.numbering.invoicePrefix,
    proforma: settings.numbering.proformaPrefix,
    advance: settings.numbering.advancePrefix,
    final: settings.numbering.finalPrefix,
    correction: settings.numbering.correctionPrefix,
    receipt: settings.numbering.receiptPrefix,
    pz: settings.numbering.pzPrefix,
    wz: settings.numbering.wzPrefix,
    rw: settings.numbering.rwPrefix,
    mm: settings.numbering.mmPrefix,
    inw: settings.numbering.inwPrefix,
    so: settings.numbering.soPrefix,
    po: settings.numbering.poPrefix,
    rma: settings.numbering.rmaPrefix,
    expense: settings.numbering.expensePrefix
  }
  return map[type] || defaultPrefixes[type] || 'DOC'
}

const resolveKey = (date, settings) => {
  if (settings.numbering.resetYearly) {
    return String(date.getFullYear())
  }
  return 'global'
}

const getNextSequence = (counters, type, date, settings) => {
  const key = resolveKey(date, settings)
  const startNumber = settings.numbering.startNumber || 1
  if (!counters[key]) counters[key] = {}
  const current = counters[key][type]
  const next = current ? current + 1 : startNumber
  return { key, next }
}

export const getDocuments = () => {
  const parsed = getItem(DOCUMENTS_KEY, []) || []
  if (parsed.length > 0) return parsed

  const legacyRaw = localStorage.getItem('invoices')
  if (!legacyRaw) return []

  const legacyDocs = JSON.parse(legacyRaw).map((invoice) => ({
    id: crypto.randomUUID(),
    type: 'invoice',
    number: invoice.number,
    issuer: invoice.issuer,
    counterparty: invoice.client,
    document: {
      type: 'invoice',
      number: invoice.number,
      issueDate: invoice.invoice?.date || invoice.date,
      saleDate: invoice.invoice?.date || invoice.date,
      paymentStatus: 'unpaid'
    },
    items: invoice.items || [],
    currency: invoice.currency || 'PLN',
    totals: {
      netto: invoice.totalNetto || '0.00',
      vat: invoice.totalVat || '0.00',
      brutto: invoice.totalBrutto || '0.00'
    },
    filename: invoice.filename || 'faktura.pdf'
  }))

  saveDocuments(legacyDocs)
  return legacyDocs
}

export const saveDocuments = (documents) => {
  setItem(DOCUMENTS_KEY, documents)
  pushCollection(DOCUMENTS_KEY, documents)
}

export const addDocument = (document) => {
  const docs = getDocuments()
  docs.unshift(document)
  saveDocuments(docs)
  return docs
}

export const removeDocument = (id) => {
  const docs = getDocuments().filter((doc) => doc.id !== id)
  saveDocuments(docs)
  return docs
}

export const updateDocument = (id, update) => {
  const docs = getDocuments().map((doc) =>
    doc.id === id ? { ...doc, ...update, document: { ...doc.document, ...update.document } } : doc
  )
  saveDocuments(docs)
  return docs
}

export const clearDocuments = () => {
  removeItem(DOCUMENTS_KEY)
}

export const getNextNumberPreview = (type, date, settings) => {
  const counters = getCounters()
  const { next } = getNextSequence(counters, type, date, settings)
  return formatNumber(resolvePrefix(type, settings), next, date)
}

export const commitNumber = (type, date, settings) => {
  const counters = getCounters()
  const { key, next } = getNextSequence(counters, type, date, settings)
  counters[key][type] = next
  saveCounters(counters)
  return formatNumber(resolvePrefix(type, settings), next, date)
}
