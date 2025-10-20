import { IsArray, ArrayMaxSize, IsString, MaxLength, ValidateNested, IsOptional } from 'class-validator';

export class RuleDto {
  @IsString()
  @MaxLength(300)
  rule: string;
}

export class CreateFanbaseDTO {
  fanbaseName: string;
  topic: string;
  fanbasePhotoUrl?: string;

  @IsOptional() // ✅ Make rules optional
  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  rules?: RuleDto[]; // ✅ Add ? to make it optional
}