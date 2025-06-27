/*

This file is a Data Transfer Object (DTO) in NestJS, which defines the structure and validation rules for data being transferred between the client and server. DTOs are used to:

Define the shape of request/response data
Validate incoming data
Provide type safety
Document API endpoints

export class CreateCatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  age: number;

  @IsString()
  @IsNotEmpty()
  breed: string;
}

*/