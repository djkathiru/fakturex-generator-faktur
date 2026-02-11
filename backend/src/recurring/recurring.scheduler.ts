import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { RecurringService } from './recurring.service'

@Injectable()
export class RecurringScheduler {
  constructor(private prisma: PrismaService, private recurringService: RecurringService) {}

  @Cron('0 * * * *')
  async handleCron() {
    const companies = await this.prisma.company.findMany({ select: { id: true } })
    for (const company of companies) {
      await this.recurringService.runDue(company.id)
    }
  }
}
