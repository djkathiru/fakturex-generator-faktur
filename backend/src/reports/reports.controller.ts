import { Controller, Get, Header, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('reports')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly-revenue')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  monthlyRevenue(@CompanyId() companyId: string, @Query('year') year?: string) {
    const y = Number(year || new Date().getFullYear())
    return this.reportsService.monthlyRevenue(companyId, y)
  }

  @Get('vat-due')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  vatDue(@CompanyId() companyId: string, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.vatDue(companyId, from, to)
  }

  @Get('top-clients')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  topClients(@CompanyId() companyId: string, @Query('limit') limit?: string) {
    return this.reportsService.topClients(companyId, limit ? Number(limit) : 5)
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  async exportCsv(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response
  ) {
    const rows = await this.reportsService.exportDocuments(companyId, from, to)
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Disposition', 'attachment; filename=raport-dokumenty.csv')
    res.end(csv)
  }

  @Get('export/xlsx')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  async exportXlsx(
    @CompanyId() companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response
  ) {
    const buffer = await this.reportsService.exportDocumentsXlsx(companyId, from, to)
    res.setHeader('Content-Disposition', 'attachment; filename=raport-dokumenty.xlsx')
    res.end(buffer)
  }
}
