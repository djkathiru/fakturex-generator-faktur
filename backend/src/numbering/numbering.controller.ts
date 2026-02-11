import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { NumberingService } from './numbering.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { UpdatePatternDto } from './dto/update-pattern.dto'
import { InvoiceType } from '@prisma/client'

@Controller('numbering')
@UseGuards(JwtAuthGuard, CompanyGuard)
export class NumberingController {
  constructor(private numberingService: NumberingService) {}

  @Get('patterns')
  list(@CompanyId() companyId: string) {
    return this.numberingService.getPatterns(companyId)
  }

  @Post('patterns')
  update(@CompanyId() companyId: string, @Body() dto: UpdatePatternDto) {
    return this.numberingService.upsertPattern(companyId, dto.type, dto.pattern, dto.reset, dto.padding)
  }

  @Post('preview')
  preview(@CompanyId() companyId: string, @Body('type') type: InvoiceType, @Body('date') date?: string) {
    return this.numberingService.preview(companyId, type, date ? new Date(date) : new Date())
  }

  @Post('next')
  next(@CompanyId() companyId: string, @Body('type') type: InvoiceType, @Body('date') date?: string) {
    return this.numberingService.next(companyId, type, date ? new Date(date) : new Date())
  }
}
