import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async list(companyId: string) {
    const products = await this.prisma.product.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })
    return products.map((product) => ({
      ...product,
      priceGross: Number(product.priceNet) * (1 + Number(product.vatRate) / 100)
    }))
  }

  create(companyId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        stock: dto.stock ?? 0,
        companyId
      }
    })
  }

  update(companyId: string, id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id, companyId }, data: dto })
  }

  remove(companyId: string, id: string) {
    return this.prisma.product.delete({ where: { id, companyId } })
  }
}
