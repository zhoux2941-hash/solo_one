import { IsString, IsNotEmpty, IsOptional, IsObject, IsDateString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty()
  producerName: string;

  @IsString()
  @IsOptional()
  producerAddress?: string;

  @IsDateString()
  @IsOptional()
  productionDate?: Date;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;
}
