import { Module } from '@nestjs/common'
import { InvoicesController } from './invoices.controller'
import { InvoicesService } from './invoices.service'
import { PdfService } from '../pdf/pdf.service'
import { MailerModule } from '../mailer/mailer.module'
import { PrismaModule } from '../prisma/prisma.module'
import { NumberingModule } from '../numbering/numbering.module'

@Module({
  imports: [MailerModule, PrismaModule, NumberingModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfService],
  exports: [InvoicesService]
})
export class InvoicesModule {}
