import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCompanyDto } from './dto/create-company.dto'
import { UpdateCompanyDto } from './dto/update-company.dto'

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCompanyDto) {
    const company = await this.prisma.company.create({
      data: {
        ...dto,
        users: { create: { userId, role: 'OWNER' } }
      }
    })
    return company
  }

  async list(userId: string) {
    return this.prisma.company.findMany({
      where: { users: { some: { userId } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async get(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) throw new NotFoundException('Nie znaleziono firmy')
    return company
  }

  async update(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({ where: { id: companyId }, data: dto })
  }

  async listMembers(companyId: string) {
    return this.prisma.companyUser.findMany({
      where: { companyId },
      include: { user: true }
    })
  }

  async addMember(companyId: string, email: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new NotFoundException('Nie znaleziono użytkownika')
    return this.prisma.companyUser.upsert({
      where: { userId_companyId: { userId: user.id, companyId } },
      create: { userId: user.id, companyId, role: role as any },
      update: { role: role as any }
    })
  }

  async updateMember(companyId: string, email: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) throw new NotFoundException('Nie znaleziono użytkownika')
    return this.prisma.companyUser.update({
      where: { userId_companyId: { userId: user.id, companyId } },
      data: { role: role as any }
    })
  }
}
