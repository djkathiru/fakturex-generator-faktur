import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { Currency, InvoiceType } from '@prisma/client'

export class CreateRecurringDto {
  @IsOptional()
  @IsString()
  clientId?: string

  @IsEnum(InvoiceType)
  type!: InvoiceType

  @IsEnum(Currency)
  currency!: Currency

  @IsOptional()
  @IsString()
  language?: string

  @IsInt()
  @Min(1)
  intervalMonths!: number

  @IsInt()
  @Min(0)
  dueDays!: number

  @IsString()
  nextRun!: string

  template!: {
    issuerName: string
    issuerNip?: string
    issuerAddr?: string
    notes?: string
    items: Array<{
      productId?: string
      name: string
      quantity: number
      unit: string
      priceNet: number
      vatRate: number
      discount?: number
    }>
  }
}
