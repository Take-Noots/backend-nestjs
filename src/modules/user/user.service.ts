import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.model';
import { CreateUserDTO } from './dto/create-user.dto';
import { UserType } from '@interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDTO): Promise<UserType> {
    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();
    return this.toUserType(savedUser);
  }

  async findByEmail(email: string): Promise<UserType | null> {
    console.log(`🔍 Searching for user with email: ${email}`);
    try {
      const user = await this.userModel.findOne({ email }).exec();
      console.log(`📝 Database query result:`, user ? 'User found' : 'User not found');
      if (user) {
        console.log(`👤 Found user: ${user.username}, Role: ${user.role}`);
      }
      return user ? this.toUserType(user) : null;
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<UserType | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.toUserType(user) : null;
  }

  // ===== DEBUG METHODS =====
  async getAllUsersForDebug(): Promise<UserType[]> {
    const users = await this.userModel.find({}).exec();
    return users.map(user => this.toUserType(user));
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      console.log(`🔐 Comparing password for hashed: ${hashedPassword.substring(0, 20)}...`);
      const result = await bcrypt.compare(plainPassword, hashedPassword);
      console.log(`🔐 Password comparison result: ${result}`);
      return result;
    } catch (error) {
      console.error('❌ Password comparison error:', error);
      return false;
    }
  }

  // ===== ADMIN METHODS (keeping minimal for now) =====
  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10): Promise<UserType[]> {
    const users = await this.userModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    return users.map(user => this.toUserType(user));
  }

  async countUsers(filter: any = {}): Promise<number> {
    return await this.userModel.countDocuments(filter).exec();
  }

  async banUser(userId: string, banData: { reason: string; duration?: number; bannedBy: string }): Promise<UserType> {
    const updateData: any = {
      isBlocked: true,
      banReason: banData.reason,
      bannedBy: banData.bannedBy,
      bannedAt: new Date()
    };

    if (banData.duration) {
      const banUntil = new Date();
      banUntil.setHours(banUntil.getHours() + banData.duration);
      updateData.banUntil = banUntil;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
    return this.toUserType(updatedUser);
  }

  async unbanUser(userId: string): Promise<UserType> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $unset: {
          isBlocked: "",
          banReason: "",
          bannedBy: "",
          bannedAt: "",
          banUntil: ""
        }
      },
      { new: true }
    ).exec();
    return this.toUserType(updatedUser);
  }

  async updateUserRole(userId: string, role: string): Promise<UserType> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).exec();
    return this.toUserType(updatedUser);
  }

  async countRecentUsers(days: number): Promise<number> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return await this.userModel.countDocuments({
      createdAt: { $gte: dateFrom }
    }).exec();
  }

  async getUserGrowthData(days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: dateFrom }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ];

    return await this.userModel.aggregate(pipeline).exec();
  }

  private toUserType(user: UserDocument): UserType {
    return {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      password: user.password,
      role: user.role,
      isBlocked: user.isBlocked,
      banReason: user.banReason,
      bannedBy: user.bannedBy?.toString(),
      bannedAt: user.bannedAt,
      banUntil: user.banUntil,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}