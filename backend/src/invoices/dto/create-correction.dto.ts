import { IsArray, IsDateString, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateInvoiceDto } from './create-invoice.dto'

class CorrectionItemDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  productId?: string

  @IsOptional()
  quantity?: number

  @IsOptional()
  unit?: CreateInvoiceDto['items'][number]['unit']

  @IsOptional()
  priceNet?: number

  @IsOptional()
  vatRate?: number

  @IsOptional()
  discount?: number
}

export class CreateCorrectionDto {
  @IsString()
  number!: string

  @IsDateString()
  issueDate!: string

  @IsDateString()
  saleDate!: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorrectionItemDto)
  items?: CorrectionItemDto[]
}
