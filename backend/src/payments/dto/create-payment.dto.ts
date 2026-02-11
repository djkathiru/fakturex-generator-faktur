import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Currency, PaymentMethod, PaymentStatus } from '@prisma/client'

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  invoiceId?: string

  @IsNumber()
  amount!: number

  @IsEnum(Currency)
  currency!: Currency

  @IsEnum(PaymentMethod)
  method!: PaymentMethod

  @IsEnum(PaymentStatus)
  status!: PaymentStatus

  @IsOptional()
  @IsDateString()
  receivedAt?: string
}
