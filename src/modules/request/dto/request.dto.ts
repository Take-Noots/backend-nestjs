

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequestRespondStatus } from '../request.model';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  requestSendUserId: string;

  @IsString()
  @IsNotEmpty()
  requestReceiveUserId: string;

  @IsString()
  @IsOptional()
  ticket?: string;
}

export class UpdateRequestDto {
  @IsEnum(RequestRespondStatus)
  @IsOptional()
  respond?: RequestRespondStatus;

}