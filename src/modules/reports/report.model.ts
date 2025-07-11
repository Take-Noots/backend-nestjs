// src/modules/reports/report.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema()
export class Report {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ required: true })
  contentType: string; // 'post', 'user', 'fanbase', 'comment'

  @Prop({ type: Types.ObjectId, required: true })
  contentId: Types.ObjectId; // ID of the reported content

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reportedUserId: Types.ObjectId; // If reporting a user

  @Prop({ required: true })
  reason: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  category: string; // 'spam', 'harassment', 'inappropriate', 'copyright', 'other'

  // Report status and resolution
  @Prop({ default: 'pending' })
  status: string; // 'pending', 'under_review', 'resolved', 'dismissed'

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy: Types.ObjectId;

  @Prop({ required: false })
  resolution: string;

  @Prop({ required: false })
  actionTaken: string; // 'content_removed', 'user_warned', 'user_banned', 'no_action'

  @Prop({ required: false })
  reviewNotes: string;

  @Prop({ required: false })
  resolvedAt: Date;

  @Prop({ default: 1 })
  priority: number; // 1 = low, 2 = medium, 3 = high

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);