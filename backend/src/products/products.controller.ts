import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CompanyGuard } from '../common/guards/company.guard'
import { CompanyId } from '../common/decorators/company-id.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('products')
@UseGuards(JwtAuthGuard, CompanyGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService, private prisma: PrismaService) {}

  @Get()
  @Roles('OWNER', 'ACCOUNTANT', 'VIEWER')
  list(@CompanyId() companyId: string) {
    return this.productsService.list(companyId)
  }

  @Post()
  @Roles('OWNER', 'ACCOUNTANT')
  create(@CompanyId() companyId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(companyId, dto)
  }

  @Put(':id')
  @Roles('OWNER', 'ACCOUNTANT')
  update(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(companyId, id, dto)
  }

  @Delete(':id')
  @Roles('OWNER', 'ACCOUNTANT')
  remove(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.productsService.remove(companyId, id)
  }

  @Post(':id/stock')
  @Roles('OWNER', 'ACCOUNTANT')
  async adjustStock(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body('delta') delta: number
  ) {
    const product = await this.prisma.product.findFirst({ where: { id, companyId } })
    const next = Math.max(0, Number(product?.stock || 0) + Number(delta || 0))
    return this.prisma.product.update({ where: { id, companyId }, data: { stock: next } })
  }
}
