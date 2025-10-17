import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostReportDocument = PostReport & Document;

@Schema({ timestamps: true })
export class PostReport {
  @Prop({ required: true })
  reporterId: string;

  @Prop({ required: true })
  reportedUserId: string;

  @Prop({ required: true })
  reportedPostId: string;

  @Prop({ required: true })
  reason: string;

  @Prop({
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: string;

  @Prop()
  adminNotes?: string;

  @Prop()
  reviewedBy?: string; // Admin user ID who reviewed this report

  @Prop()
  reviewedAt?: Date; // When the report was reviewed

  @Prop({ default: Date.now })
  reportTime: Date;
}

export const PostReportSchema = SchemaFactory.createForClass(PostReport);
