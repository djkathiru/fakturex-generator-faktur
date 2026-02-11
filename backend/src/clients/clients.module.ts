import { Module } from '@nestjs/common'
import { ClientsController } from './clients.controller'
import { ClientsService } from './clients.service'
import { PrismaModule } from '../prisma/prisma.module'
import { InvoicesModule } from '../invoices/invoices.module'

@Module({
  imports: [PrismaModule, InvoicesModule],
  controllers: [ClientsController],
  providers: [ClientsService]
})
export class ClientsModule {}
