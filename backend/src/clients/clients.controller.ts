import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { InvoicesService } from '../invoices/invoices.service'

@Controller('clients')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService, private invoicesService: InvoicesService) {}

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  list(@CompanyId() companyId: string, @Query('nip') nip?: string) {
    return this.clientsService.list(companyId, nip)
  }

  @Post()
  @Roles('OWNER', 'ACCOUNTANT')
  create(@CompanyId() companyId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(companyId, dto)
  }

  @Put(':id')
  @Roles('OWNER', 'ACCOUNTANT')
  update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(companyId, id, dto)
  }

  @Post(':id/tags')
  @Roles('OWNER', 'ACCOUNTANT')
  addTags(@CompanyId() companyId: string, @Param('id') id: string, @Body('tags') tags: string[]) {
    return this.clientsService.addTags(companyId, id, tags || [])
  }

  @Delete(':id/tags')
  @Roles('OWNER', 'ACCOUNTANT')
  removeTags(@CompanyId() companyId: string, @Param('id') id: string, @Body('tags') tags: string[]) {
    return this.clientsService.removeTags(companyId, id, tags || [])
  }

  @Delete(':id')
  @Roles('OWNER', 'ACCOUNTANT')
  remove(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.clientsService.remove(companyId, id)
  }

  @Get(':id/invoices')
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  history(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.invoicesService.list(companyId, undefined, id)
  }
}
