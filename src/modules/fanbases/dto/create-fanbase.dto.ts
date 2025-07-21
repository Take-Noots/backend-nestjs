// src/modules/fanbases/dto/create-fanbase.dto.ts
export class CreateFanbaseDTO {
  fanbaseName: string;
  topic: string;
  createdUserId: string; // Match database field name
  fanbasePhotoUrl?: string;
}