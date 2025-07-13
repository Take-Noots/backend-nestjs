// src/modules/reports/dto/create-report.dto.ts
export class CreateReportDTO {
  reportedBy: string;
  contentType: string;
  contentId: string;
  reportedUserId?: string;
  reason: string;
  description?: string;
  category: string;
  priority?: number;
}