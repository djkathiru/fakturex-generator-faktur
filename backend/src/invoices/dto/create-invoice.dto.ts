import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Currency, InvoiceType, Unit } from '@prisma/client'

class CreateInvoiceItemDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  productId?: string

  @IsNumber()
  quantity!: number

  @IsEnum(Unit)
  unit!: Unit

  @IsNumber()
  priceNet!: number

  @IsNumber()
  vatRate!: number

  @IsOptional()
  @IsNumber()
  discount?: number
}

export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  clientId?: string

  @IsEnum(InvoiceType)
  type!: InvoiceType

  @IsString()
  number!: string

  @IsDateString()
  issueDate!: string

  @IsDateString()
  saleDate!: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsEnum(Currency)
  currency!: Currency

  @IsOptional()
  @IsNumber()
  exchangeRate?: number

  @IsOptional()
  @IsDateString()
  exchangeDate?: string

  @IsOptional()
  @IsString()
  language?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsString()
  issuerName!: string

  @IsOptional()
  @IsString()
  issuerNip?: string

  @IsOptional()
  @IsString()
  issuerAddr?: string

  @IsOptional()
  @IsNumber()
  totalNet?: number

  @IsOptional()
  @IsNumber()
  totalVat?: number

  @IsOptional()
  @IsNumber()
  totalGross?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items!: CreateInvoiceItemDto[]
}
