import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.model';
import { CreateUserDTO } from './dto/create-user.dto';
import { UserType } from '../../common/interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDTO): Promise<UserType> {
    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();
    return this.toUserType(savedUser);
  }

  async findByEmail(email: string): Promise<UserType | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.toUserType(user) : null;
  }

  async findById(id: string): Promise<UserType | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toUserType(user) : null;
  }



  private toUserType(user: UserDocument): UserType {
    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
    };
  }
}