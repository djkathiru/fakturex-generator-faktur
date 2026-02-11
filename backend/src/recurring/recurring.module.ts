import { Module } from '@nestjs/common'
import { RecurringController } from './recurring.controller'
import { RecurringService } from './recurring.service'
import { RecurringScheduler } from './recurring.scheduler'
import { PrismaModule } from '../prisma/prisma.module'
import { InvoicesModule } from '../invoices/invoices.module'

@Module({
  imports: [PrismaModule, InvoicesModule],
  controllers: [RecurringController],
  providers: [RecurringService, RecurringScheduler]
})
export class RecurringModule {}
