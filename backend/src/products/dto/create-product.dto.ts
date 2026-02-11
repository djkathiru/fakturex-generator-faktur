import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { Unit } from '@prisma/client'

export class CreateProductDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  sku?: string

  @IsEnum(Unit)
  unit!: Unit

  @IsNumber()
  priceNet!: number

  @IsNumber()
  vatRate!: number

  @IsOptional()
  @IsNumber()
  stock?: number

  @IsOptional()
  @IsString()
  location?: string
}
