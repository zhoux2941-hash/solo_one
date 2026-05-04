import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PrivateDataDto, ActorIdentityDto } from './privacy.dto';

export class AddLogisticsNodeDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  actorName: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsObject()
  @IsOptional()
  additionalData?: Record<string, any>;

  @ValidateNested()
  @Type(() => PrivateDataDto)
  @IsOptional()
  privateData?: PrivateDataDto;

  @ValidateNested()
  @Type(() => ActorIdentityDto)
  @IsOptional()
  requesterIdentity?: ActorIdentityDto;
}
