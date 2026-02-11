import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  list(companyId: string, nip?: string) {
    return this.prisma.client.findMany({
      where: { companyId, ...(nip ? { nip } : {}) },
      orderBy: { createdAt: 'desc' }
    })
  }

  async addTags(companyId: string, id: string, tags: string[]) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } })
    const existing = client?.tags ?? []
    const next = Array.from(new Set([...existing, ...tags]))
    return this.prisma.client.update({ where: { id, companyId }, data: { tags: next } })
  }

  async removeTags(companyId: string, id: string, tags: string[]) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } })
    const existing = client?.tags ?? []
    const next = existing.filter((tag) => !tags.includes(tag))
    return this.prisma.client.update({ where: { id, companyId }, data: { tags: next } })
  }

  create(companyId: string, dto: CreateClientDto) {
    return this.prisma.client.create({ data: { ...dto, companyId, tags: dto.tags || [] } })
  }

  update(companyId: string, id: string, dto: UpdateClientDto) {
    return this.prisma.client.update({ where: { id, companyId }, data: { ...dto, tags: dto.tags || [] } })
  }

  remove(companyId: string, id: string) {
    return this.prisma.client.delete({ where: { id, companyId } })
  }
}
