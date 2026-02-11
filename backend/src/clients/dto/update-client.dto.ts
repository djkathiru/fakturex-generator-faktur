import { IsArray, IsOptional, IsString } from 'class-validator'

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  nip?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsArray()
  tags?: string[]
}
