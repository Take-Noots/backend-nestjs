import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: Role, type: String, default: Role.User })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);