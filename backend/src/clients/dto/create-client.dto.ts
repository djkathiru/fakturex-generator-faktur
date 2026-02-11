import { IsArray, IsOptional, IsString } from 'class-validator'

export class CreateClientDto {
  @IsString()
  name!: string

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
