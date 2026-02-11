import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const companyId = request.headers['x-company-id']
    if (!user || !companyId || typeof companyId !== 'string') {
      throw new UnauthorizedException('Brak Company ID')
    }

    const membership = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: user.sub, companyId } }
    })

    if (!membership) {
      throw new UnauthorizedException('Brak dostępu do firmy')
    }

    request.companyId = companyId
    request.companyRole = membership.role
    return true
  }
}
