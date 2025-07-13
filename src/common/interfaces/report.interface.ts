// src/common/interfaces/report.interface.ts
export interface ReportType {
  _id: string;
  reportedBy: string;
  contentType: string;
  contentId: string;
  reportedUserId?: string;
  reason: string;
  description?: string;
  category: string;
  status: string;
  reviewedBy?: string;
  resolution?: string;
  actionTaken?: string;
  reviewNotes?: string;
  resolvedAt?: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}