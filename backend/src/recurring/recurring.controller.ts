import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { RecurringService } from './recurring.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { CreateRecurringDto } from './dto/create-recurring.dto'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('recurring')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class RecurringController {
  constructor(private recurringService: RecurringService) {}

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  list(@CompanyId() companyId: string) {
    return this.recurringService.list(companyId)
  }

  @Post()
  @Roles('OWNER', 'ACCOUNTANT')
  create(@CompanyId() companyId: string, @Body() dto: CreateRecurringDto) {
    return this.recurringService.create(companyId, dto)
  }

  @Post('run')
  @Roles('OWNER', 'ACCOUNTANT')
  run(@CompanyId() companyId: string) {
    return this.recurringService.runDue(companyId)
  }
}
