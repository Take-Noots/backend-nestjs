// src/modules/fanbases/fanbase.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type FanbaseDocument = HydratedDocument<Fanbase>;

@Schema()
export class Fanbase {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  fanbaseName: string;

  @Prop({ required: true })
  topic: string;

  @Prop({
    type: {
      _id: { type: String, required: true },
      username: { type: String, required: true }
    },
    required: false
  })
  createdBy: {
    _id: string;
    username: string;
  };

  @Prop({ required: false })
  fanbasePhotoUrl: string;

  @Prop({ default: 0 })
  numberOfLikes: number;

  @Prop([{ type: String }])
  likedUserIds: string[];

  @Prop({ default: 0 })
  numberOfPosts: number;

  @Prop([{ type: String }])
  postIds: string[];

  @Prop([{ type: String }])
  joinedUserIds: string[];

  @Prop({ default: 0 })
  numberOfShares: number; 

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FanbaseSchema = SchemaFactory.createForClass(Fanbase);