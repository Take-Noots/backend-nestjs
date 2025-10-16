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

  @Prop()
  adminNotes?: string;

  @Prop({ default: Date.now })
  reportTime: Date;
}

export const PostReportSchema = SchemaFactory.createForClass(PostReport);
