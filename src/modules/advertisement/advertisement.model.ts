import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type AdvertisementDocument = HydratedDocument<Advertisement>;

@Schema()
export class Advertisement {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: false })
  video: string;

  @Prop({ required: false })
  contactDetails: string;

  @Prop({ required: false })
  location: string;

  @Prop({ required: false })
  genre: string;

  @Prop({ required: false })
  hashtags: string;

  @Prop({ required: false })
  keywords: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);
