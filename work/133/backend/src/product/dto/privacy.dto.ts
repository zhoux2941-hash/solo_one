import { IsString, IsOptional, IsNumber, IsObject, IsEnum } from 'class-validator';

export enum ActorRole {
  PRODUCER = 'producer',
  LOGISTICS = 'logistics',
  CONSUMER = 'consumer',
}

export class PrivateDataDto {
  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  internalOrderId?: string;

  @IsString()
  @IsOptional()
  routeDetails?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  commission?: number;

  @IsString()
  @IsOptional()
  supplierInfo?: string;

  @IsObject()
  @IsOptional()
  [key: string]: any;
}

export class ActorIdentityDto {
  @IsEnum(ActorRole)
  @IsOptional()
  role?: ActorRole;

  @IsString()
  @IsOptional()
  actorName?: string;

  @IsString()
  @IsOptional()
  actorKey?: string;
}
