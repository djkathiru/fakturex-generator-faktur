import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('payments')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService, private prisma: PrismaService) {}

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  list(@CompanyId() companyId: string) {
    return this.paymentsService.list(companyId)
  }

  @Post()
  @Roles('OWNER', 'ACCOUNTANT')
  create(@CompanyId() companyId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(companyId, dto)
  }

  @Post('register')
  @Roles('OWNER', 'ACCOUNTANT')
  register(@CompanyId() companyId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.register(companyId, dto)
  }

  @Get('receivables')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  async receivables(@CompanyId() companyId: string, @Query('overdue') overdue?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId },
      orderBy: { dueDate: 'asc' }
    })

    const today = new Date().toISOString().slice(0, 10)
    return invoices
      .filter((inv) => inv.dueDate)
      .filter((inv) => (overdue === 'true' ? inv.dueDate!.toISOString().slice(0, 10) < today : true))
      .map((inv) => ({
        id: inv.id,
        number: inv.number,
        dueDate: inv.dueDate,
        totalGross: inv.totalGross,
        currency: inv.currency
      }))
  }
}
