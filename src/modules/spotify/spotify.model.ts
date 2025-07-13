import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SpotifySessionDocument = HydratedDocument<SpotifySession>;

@Schema()
export class SpotifySession {
  @Prop({ required: true, unique: true })
  user_id: string;

  @Prop({ required: true })
  refresh_token: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SpotifySessionSchema = SchemaFactory.createForClass(SpotifySession);
