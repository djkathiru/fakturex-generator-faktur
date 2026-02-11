import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { CreateCorrectionDto } from './dto/create-correction.dto'
import { NumberingService } from '../numbering/numbering.service'

const calcTotals = (type: string, items: CreateInvoiceDto['items']) => {
  let totalNet = 0
  let totalVat = 0
  let totalGross = 0

  const normalizedItems = items.map((item) => {
    const discount = Number(item.discount ?? 0)
    const qty = Number(item.quantity)
    const priceNet = Number(item.priceNet)
    const net = qty * priceNet * (1 - discount / 100)
    const vatRate = type === 'NO_VAT' ? 0 : Number(item.vatRate)
    const vat = net * (vatRate / 100)
    const gross = net + vat
    totalNet += net
    totalVat += vat
    totalGross += gross
    return { ...item, vatRate }
  })

  return {
    items: normalizedItems,
    totals: {
      totalNet: Number(totalNet.toFixed(2)),
      totalVat: Number(totalVat.toFixed(2)),
      totalGross: Number(totalGross.toFixed(2))
    }
  }
}

const mapInvoiceItemsToDto = (items: any[]) =>
  items.map((item) => ({
    productId: item.productId ?? undefined,
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    priceNet: Number(item.priceNet),
    vatRate: Number(item.vatRate),
    discount: Number(item.discount ?? 0)
  }))

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService, private numberingService: NumberingService) {}

  list(companyId: string, type?: string, clientId?: string) {
    return this.prisma.invoice.findMany({
      where: {
        companyId,
        ...(type ? { type: type as any } : {}),
        ...(clientId ? { clientId } : {})
      },
      include: { items: true, client: true },
      orderBy: { issueDate: 'desc' }
    })
  }

  async get(companyId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, companyId },
      include: { items: true, client: true }
    })
    if (!invoice) throw new NotFoundException('Nie znaleziono faktury')
    return invoice
  }

  createAdvance(companyId: string, dto: CreateInvoiceDto) {
    return this.create(companyId, { ...dto, type: 'ADVANCE' })
  }

  async duplicate(companyId: string, id: string, number: string) {
    const original = await this.get(companyId, id)
    const items = mapInvoiceItemsToDto(original.items)
    const { items: normalizedItems, totals } = calcTotals(original.type, items)

    return this.prisma.invoice.create({
      data: {
        companyId,
        clientId: original.clientId,
        type: original.type,
        number,
        issueDate: new Date(),
        saleDate: new Date(),
        dueDate: original.dueDate,
        currency: original.currency,
        language: original.language,
        notes: original.notes,
        issuerName: original.issuerName,
        issuerNip: original.issuerNip,
        issuerAddr: original.issuerAddr,
        totalNet: totals.totalNet,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        duplicateOfId: original.id,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId ?? null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            priceNet: item.priceNet,
            vatRate: item.vatRate,
            discount: item.discount ?? 0
          }))
        }
      }
    })
  }

  async createCorrection(companyId: string, id: string, dto: CreateCorrectionDto) {
    const original = await this.get(companyId, id)
    const baseItems = mapInvoiceItemsToDto(original.items)

    const items = dto.items?.length
      ? dto.items.map((item, index) => ({
          ...baseItems[index],
          ...item,
          quantity: Number(item.quantity ?? baseItems[index]?.quantity ?? 0),
          priceNet: Number(item.priceNet ?? baseItems[index]?.priceNet ?? 0),
          vatRate: Number(item.vatRate ?? baseItems[index]?.vatRate ?? 0),
          discount: Number(item.discount ?? baseItems[index]?.discount ?? 0)
        }))
      : baseItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity) * -1
        }))

    const { items: normalizedItems, totals } = calcTotals('CORRECTION', items as any)

    return this.prisma.invoice.create({
      data: {
        companyId,
        clientId: original.clientId,
        type: 'CORRECTION',
        number: dto.number,
        issueDate: new Date(dto.issueDate),
        saleDate: new Date(dto.saleDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        currency: original.currency,
        language: original.language,
        notes: dto.notes,
        issuerName: original.issuerName,
        issuerNip: original.issuerNip,
        issuerAddr: original.issuerAddr,
        totalNet: totals.totalNet,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        correctionOfId: original.id,
        items: {
          create: normalizedItems.map((item) => ({
            productId: item.productId ?? null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            priceNet: item.priceNet,
            vatRate: item.vatRate,
            discount: item.discount ?? 0
          }))
        }
      }
    })
  }

  async create(companyId: string, dto: CreateInvoiceDto) {
    const number = dto.number?.trim()
      ? dto.number
      : await this.numberingService.next(companyId, dto.type, new Date(dto.issueDate))
    const { items, totals } = calcTotals(dto.type, dto.items)
    return this.prisma.invoice.create({
      data: {
        companyId,
        clientId: dto.clientId ?? null,
        type: dto.type,
        number,
        issueDate: new Date(dto.issueDate),
        saleDate: new Date(dto.saleDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        currency: dto.currency,
        exchangeRate: dto.exchangeRate ?? null,
        exchangeDate: dto.exchangeDate ? new Date(dto.exchangeDate) : null,
        language: dto.language ?? 'pl',
        notes: dto.notes,
        issuerName: dto.issuerName,
        issuerNip: dto.issuerNip,
        issuerAddr: dto.issuerAddr,
        totalNet: totals.totalNet,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        items: {
          create: items.map((item) => ({
            productId: item.productId ?? null,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            priceNet: item.priceNet,
            vatRate: item.vatRate,
            discount: item.discount ?? 0
          }))
        }
      }
    })
  }
}
