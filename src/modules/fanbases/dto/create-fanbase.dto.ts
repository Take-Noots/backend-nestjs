// src/modules/fanbases/dto/create-fanbase.dto.ts
export class CreateFanbaseDTO {
  name: string;
  description: string;
  createdBy: string;
  imageUrl?: string;
  category?: string;
  visibility?: string;
}