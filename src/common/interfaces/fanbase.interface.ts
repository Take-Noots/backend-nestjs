// src/common/interfaces/fanbase.interface.ts
export interface FanbaseType {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
  imageUrl?: string;
  category?: string;
  membersCount: number;
  postsCount: number;
  moderators: string[];
  visibility: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedReason?: string;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}