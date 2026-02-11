import { Injectable } from '@nestjs/common'
import { InvoiceType, ResetPeriod } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const defaultPatterns: Record<InvoiceType, { pattern: string; reset: ResetPeriod; padding: number }> = {
  INVOICE: { pattern: 'FV/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 },
  PROFORMA: { pattern: 'PF/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 },
  ADVANCE: { pattern: 'FZ/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 },
  FINAL: { pattern: 'FK/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 },
  CORRECTION: { pattern: 'KOR/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 },
  RECEIPT: { pattern: 'PAR/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 },
  NO_VAT: { pattern: 'FBEZ/{YYYY}/{MM}/{SEQ}', reset: ResetPeriod.MONTHLY, padding: 3 }
}

@Injectable()
export class NumberingService {
  constructor(private prisma: PrismaService) {}

  async getPatterns(companyId: string) {
    const existing = await this.prisma.numberingPattern.findMany({ where: { companyId } })
    const map = new Map(existing.map((p) => [p.type, p]))
    return (Object.keys(defaultPatterns) as InvoiceType[]).map((type) => {
      const fallback = defaultPatterns[type]
      const saved = map.get(type)
      return {
        type,
        pattern: saved?.pattern ?? fallback.pattern,
        reset: saved?.reset ?? fallback.reset,
        padding: saved?.padding ?? fallback.padding
      }
    })
  }

  async upsertPattern(companyId: string, type: InvoiceType, pattern: string, reset: ResetPeriod, padding: number) {
    return this.prisma.numberingPattern.upsert({
      where: { companyId_type: { companyId, type } },
      create: { companyId, type, pattern, reset, padding },
      update: { pattern, reset, padding }
    })
  }

  async preview(companyId: string, type: InvoiceType, date = new Date()) {
    const { pattern, reset, padding } = await this.getPattern(companyId, type)
    const seq = await this.getNextSequence(companyId, type, date, reset, false)
    return this.format(pattern, date, seq, padding)
  }

  async next(companyId: string, type: InvoiceType, date = new Date()) {
    const { pattern, reset, padding } = await this.getPattern(companyId, type)
    const seq = await this.getNextSequence(companyId, type, date, reset, true)
    return this.format(pattern, date, seq, padding)
  }

  private async getPattern(companyId: string, type: InvoiceType) {
    const saved = await this.prisma.numberingPattern.findUnique({
      where: { companyId_type: { companyId, type } }
    })
    return saved ?? defaultPatterns[type]
  }

  private format(pattern: string, date: Date, seq: number, padding: number) {
    const YYYY = String(date.getFullYear())
    const MM = String(date.getMonth() + 1).padStart(2, '0')
    const DD = String(date.getDate()).padStart(2, '0')
    const SEQ = String(seq).padStart(padding, '0')
    return pattern
      .replace('{YYYY}', YYYY)
      .replace('{MM}', MM)
      .replace('{DD}', DD)
      .replace('{SEQ}', SEQ)
  }

  private async getNextSequence(
    companyId: string,
    type: InvoiceType,
    date: Date,
    reset: ResetPeriod,
    commit: boolean
  ) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = {
      companyId,
      type,
      year: reset === ResetPeriod.NONE ? 0 : year,
      month: reset === ResetPeriod.MONTHLY ? month : 0
    }

    const existing = await this.prisma.invoiceSequence.findUnique({
      where: { companyId_type_year_month: key }
    })

    const nextSeq = existing ? existing.seq + 1 : 1
    if (!commit) return nextSeq

    await this.prisma.invoiceSequence.upsert({
      where: { companyId_type_year_month: key },
      create: { ...key, seq: nextSeq },
      update: { seq: nextSeq }
    })

    return nextSeq
  }
}
