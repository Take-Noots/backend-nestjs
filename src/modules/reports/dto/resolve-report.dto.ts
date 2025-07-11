// src/modules/reports/dto/resolve-report.dto.ts
export class ResolveReportDTO {
  resolution: string;
  actionTaken: string;
  reviewNotes?: string;
  reviewedBy: string;
}