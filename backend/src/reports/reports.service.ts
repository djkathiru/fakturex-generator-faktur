import { Injectable } from '@nestjs/common'
import ExcelJS from 'exceljs'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async monthlyRevenue(companyId: string, year: number) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { issueDate: 'asc' }
    })

    const byMonth = Array.from({ length: 12 }).map((_, idx) => ({
      month: idx + 1,
      net: 0,
      vat: 0,
      gross: 0
    }))

    invoices.forEach((inv) => {
      const date = inv.issueDate
      if (date.getFullYear() !== year) return
      const bucket = byMonth[date.getMonth()]
      bucket.net += Number(inv.totalNet)
      bucket.vat += Number(inv.totalVat)
      bucket.gross += Number(inv.totalGross)
    })

    return byMonth.map((row) => ({
      ...row,
      net: Number(row.net.toFixed(2)),
      vat: Number(row.vat.toFixed(2)),
      gross: Number(row.gross.toFixed(2))
    }))
  }

  async vatDue(companyId: string, from: string, to: string) {
    const start = new Date(from)
    const end = new Date(to)

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end }
      }
    })

    const totalVat = invoices.reduce((sum, inv) => sum + Number(inv.totalVat), 0)
    return { from, to, vatDue: Number(totalVat.toFixed(2)) }
  }

  async topClients(companyId: string, limit = 5) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      include: { client: true }
    })

    const map = new Map<string, { clientId: string; name: string; total: number }>()
    invoices.forEach((inv) => {
      if (!inv.clientId) return
      const key = inv.clientId
      const current = map.get(key) ?? { clientId: key, name: inv.client?.name || '—', total: 0 }
      current.total += Number(inv.totalGross)
      map.set(key, current)
    })

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map((row) => ({ ...row, total: Number(row.total.toFixed(2)) }))
  }

  async exportDocuments(companyId: string, from: string, to: string) {
    const start = from ? new Date(from) : new Date('2000-01-01')
    const end = to ? new Date(to) : new Date('2100-01-01')

    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: start, lte: end }
      },
      include: { client: true }
    })

    const rows: (string | number)[][] = [
      ['Numer', 'Typ', 'Kontrahent', 'Data', 'Netto', 'VAT', 'Brutto', 'Waluta']
    ]

    invoices.forEach((inv) => {
      rows.push([
        inv.number,
        inv.type,
        inv.client?.name ?? '-',
        inv.issueDate.toISOString().slice(0, 10),
        Number(inv.totalNet).toFixed(2),
        Number(inv.totalVat).toFixed(2),
        Number(inv.totalGross).toFixed(2),
        inv.currency
      ])
    })

    return rows
  }

  async exportDocumentsXlsx(companyId: string, from: string, to: string) {
    const rows = await this.exportDocuments(companyId, from, to)
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Raport')
    rows.forEach((row) => sheet.addRow(row))
    sheet.columns.forEach((col) => {
      col.width = 18
    })
    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
  }
}
