import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { RolesGuard } from '../common/guards/roles.guard'

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.companiesService.list(user.sub)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.sub, dto)
  }

  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get('current')
  getCurrent(@CompanyId() companyId: string) {
    return this.companiesService.get(companyId)
  }

  @UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
  @Put('current')
  @Roles('OWNER')
  updateCurrent(@CompanyId() companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(companyId, dto)
  }

  @UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
  @Get(':id/members')
  @Roles('OWNER')
  listMembers(@Param('id') id: string) {
    return this.companiesService.listMembers(id)
  }

  @UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
  @Post(':id/members')
  @Roles('OWNER')
  addMember(@Param('id') id: string, @Body('email') email: string, @Body('role') role: string) {
    return this.companiesService.addMember(id, email, role)
  }

  @UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
  @Put(':id/members')
  @Roles('OWNER')
  updateMember(@Param('id') id: string, @Body('email') email: string, @Body('role') role: string) {
    return this.companiesService.updateMember(id, email, role)
  }
}
