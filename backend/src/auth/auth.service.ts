import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) {
      throw new UnauthorizedException('Użytkownik już istnieje')
    }

    const hash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hash, name: dto.name }
    })

    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role })
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Nieprawidłowe dane logowania')

    const match = await bcrypt.compare(dto.password, user.password)
    if (!match) throw new UnauthorizedException('Nieprawidłowe dane logowania')

    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email, role: user.role })
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  }
}
