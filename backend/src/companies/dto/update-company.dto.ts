import { IsOptional, IsString } from 'class-validator'

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  nip?: string

  @IsOptional()
  @IsString()
  regon?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  postal?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  website?: string

  @IsOptional()
  @IsString()
  logoUrl?: string
}
