import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { CompaniesModule } from './companies/companies.module'
import { ClientsModule } from './clients/clients.module'
import { ProductsModule } from './products/products.module'
import { InvoicesModule } from './invoices/invoices.module'
import { PaymentsModule } from './payments/payments.module'
import { NumberingModule } from './numbering/numbering.module'
import { MailerModule } from './mailer/mailer.module'
import { ReportsModule } from './reports/reports.module'
import { RecurringModule } from './recurring/recurring.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    ClientsModule,
    ProductsModule,
    InvoicesModule,
    PaymentsModule,
    NumberingModule,
    MailerModule,
    ReportsModule,
    RecurringModule
  ]
})
export class AppModule {}
