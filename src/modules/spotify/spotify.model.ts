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

  // Track retry attempts for token refresh failures
  @Prop({ default: 0 })
  retry_count: number;

  @Prop({ default: null })
  last_retry_at: Date;

  // Flag to indicate token needs user confirmation to clear
  @Prop({ default: false })
  requires_user_confirmation: boolean;

  @Prop({ default: null })
  last_error_message: string;
}

export const SpotifySessionSchema =
  SchemaFactory.createForClass(SpotifySession);
