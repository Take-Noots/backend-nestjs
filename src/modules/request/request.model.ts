import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RequestDocument = Request & Document;

export enum RequestRespondStatus {
  PENDING = 'pending',
  CONFIRM = 'confirm',
  DELETE = 'delete',
}

@Schema({ timestamps: true })
export class Request {
  @Prop({ required: true })
  requestSendUserId: string;

  @Prop({ required: true })
  requestReceiveUserId: string;

  @Prop({
    type: String,
    enum: RequestRespondStatus,
    default: RequestRespondStatus.PENDING,
  })
  respond: RequestRespondStatus;

  @Prop({ required: true })
  requestSendDate: Date;

}

export const RequestSchema = SchemaFactory.createForClass(Request);