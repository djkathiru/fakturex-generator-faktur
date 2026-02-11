import { Body, Controller, Get, Header, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { InvoicesService } from './invoices.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { CreateCorrectionDto } from './dto/create-correction.dto'
import { PdfService } from '../pdf/pdf.service'
import { renderInvoiceHtml } from '../pdf/template'
import { MailerService } from '../mailer/mailer.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('invoices')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
    private mailerService: MailerService
  ) {}

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  list(@CompanyId() companyId: string, @Query('type') type?: string) {
    return this.invoicesService.list(companyId, type)
  }

  @Get(':id')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  get(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.invoicesService.get(companyId, id)
  }

  @Get(':id/html')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  async getHtml(@CompanyId() companyId: string, @Param('id') id: string, @Query('lang') lang?: string) {
    const invoice = await this.invoicesService.get(companyId, id)
    return renderInvoiceHtml(invoice as any, lang || invoice.language || 'pl')
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  async getPdf(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Query('lang') lang: string | undefined,
    @Res() res: Response
  ) {
    const invoice = await this.invoicesService.get(companyId, id)
    const html = renderInvoiceHtml(invoice as any, lang || invoice.language || 'pl')
    const pdf = await this.pdfService.renderPdf(html)
    res.setHeader('Content-Disposition', `inline; filename=${invoice.number}.pdf`)
    res.end(pdf)
  }

  @Post(':id/email')
  @Roles('OWNER', 'ACCOUNTANT')
  async emailInvoice(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body('to') to: string,
    @Body('lang') lang?: string
  ) {
    const invoice = await this.invoicesService.get(companyId, id)
    const language = lang || invoice.language || 'pl'
    const html = renderInvoiceHtml(invoice as any, language)
    const pdf = await this.pdfService.renderPdf(html)
    const subject = `Faktura ${invoice.number}`
    return this.mailerService.sendInvoice(to, subject, html, pdf, `${invoice.number}.pdf`)
  }

  @Post()
  @Roles('OWNER', 'ACCOUNTANT')
  create(@CompanyId() companyId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(companyId, dto)
  }

  @Post('advance')
  @Roles('OWNER', 'ACCOUNTANT')
  createAdvance(@CompanyId() companyId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.createAdvance(companyId, dto)
  }

  @Post(':id/duplicate')
  @Roles('OWNER', 'ACCOUNTANT')
  duplicate(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body('number') number: string
  ) {
    return this.invoicesService.duplicate(companyId, id, number)
  }

  @Post(':id/correction')
  @Roles('OWNER', 'ACCOUNTANT')
  createCorrection(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body() dto: CreateCorrectionDto
  ) {
    return this.invoicesService.createCorrection(companyId, id, dto)
  }
}
