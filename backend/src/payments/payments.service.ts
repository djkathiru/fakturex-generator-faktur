import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaymentDto } from './dto/create-payment.dto'

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.payment.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })
  }

  async register(companyId: string, dto: CreatePaymentDto) {
    const payment = await this.create(companyId, dto)
    if (dto.invoiceId) {
      await this.recalculateInvoiceStatus(dto.invoiceId)
    }
    return payment
  }

  create(companyId: string, dto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        companyId,
        invoiceId: dto.invoiceId ?? null,
        amount: dto.amount,
        currency: dto.currency,
        method: dto.method,
        status: dto.status,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : null
      }
    })
  }

  async recalculateInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) return

    const payments = await this.prisma.payment.findMany({ where: { invoiceId } })
    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    const totalGross = Number(invoice.totalGross)

    let status: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID'
    if (totalPaid >= totalGross && totalGross > 0) status = 'PAID'
    if (totalPaid > 0 && totalPaid < totalGross) status = 'PARTIAL'

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { paymentStatus: status }
    })
  }
}
