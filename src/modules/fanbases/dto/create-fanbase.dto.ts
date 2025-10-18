import { IsArray, ArrayMaxSize, IsString, MaxLength, ValidateNested } from 'class-validator';

export class RuleDto {
  @IsString()
  @MaxLength(300)
  rule: string;
}

export class CreateFanbaseDTO {
  fanbaseName: string;
  topic: string;
  fanbasePhotoUrl?: string;
  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  rules: RuleDto[];
}