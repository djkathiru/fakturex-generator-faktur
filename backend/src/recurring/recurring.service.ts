import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRecurringDto } from './dto/create-recurring.dto'
import { InvoicesService } from '../invoices/invoices.service'

const addMonths = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

@Injectable()
export class RecurringService {
  constructor(private prisma: PrismaService, private invoicesService: InvoicesService) {}

  list(companyId: string) {
    return this.prisma.recurringInvoice.findMany({ where: { companyId }, orderBy: { nextRun: 'asc' } })
  }

  create(companyId: string, dto: CreateRecurringDto) {
    return this.prisma.recurringInvoice.create({
      data: {
        companyId,
        clientId: dto.clientId ?? null,
        type: dto.type,
        currency: dto.currency,
        language: dto.language ?? 'pl',
        dueDays: dto.dueDays,
        intervalMonths: dto.intervalMonths,
        nextRun: new Date(dto.nextRun),
        template: dto.template
      }
    })
  }

  async runDue(companyId: string) {
    const due = await this.prisma.recurringInvoice.findMany({
      where: { companyId, active: true, nextRun: { lte: new Date() } }
    })

    for (const rec of due) {
      const today = new Date()
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + rec.dueDays)

      await this.invoicesService.create(companyId, {
        clientId: rec.clientId ?? undefined,
        type: rec.type,
        number: '',
        issueDate: today.toISOString().slice(0, 10),
        saleDate: today.toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        currency: rec.currency,
        language: rec.language,
        issuerName: (rec.template as any).issuerName,
        issuerNip: (rec.template as any).issuerNip,
        issuerAddr: (rec.template as any).issuerAddr,
        notes: (rec.template as any).notes,
        items: (rec.template as any).items
      } as any)

      await this.prisma.recurringInvoice.update({
        where: { id: rec.id },
        data: {
          lastRun: today,
          nextRun: addMonths(rec.nextRun, rec.intervalMonths)
        }
      })
    }

    return { processed: due.length }
  }
}
