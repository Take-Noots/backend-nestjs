import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.model';
import { CreateUserDTO } from './dto/create-user.dto';
import { UserType } from '@interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // ===== NEW SEARCH METHOD =====
  async searchUsers(query: string): Promise<any[]> {
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
    
    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ],
        isBlocked: { $ne: true } // Exclude blocked users
      })
      .select('_id username email lastActive createdAt')
      .limit(20) // Limit results to prevent performance issues
      .exec();

    return users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      profileImage: null, // You can add this field to your model if needed
      isOnline: this.isUserOnline(user.lastActive), // Check if user was active recently
      lastSeen: user.lastActive || user.createdAt
    }));
  }

  // Helper method to determine if user is online (active within last 5 minutes)
  private isUserOnline(lastActive: Date): boolean {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActive > fiveMinutesAgo;
  }

  // ===== EXISTING METHODS (UNCHANGED) =====
  async create(createUserDto: CreateUserDTO): Promise<UserType> {
    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();
    return this.toUserType(savedUser);
  }

  async findByEmail(email: string): Promise<UserType | null> {
    console.log(`🔍 Searching for user with email: ${email}`);
    try {
      const user = await this.userModel.findOne({ email }).exec();
      console.log(`🔍 Database query result:`, user ? 'User found' : 'User not found');
      if (user) {
        console.log(`👤 Found user: ${user.username}, Role: ${user.role}`);
        console.log(`🔑 Password hash: ${user.password.substring(0, 20)}...`);
        console.log(`🆔 User ID: ${user._id} (type: ${typeof user._id})`);
        console.log(`🆔 User ID as string: ${user._id.toString()}`);
      }
      return user ? this.toUserType(user) : null;
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<UserType | null> {
    console.log('🔍 UserService.findById called with:', id);
    console.log('🔍 ID type:', typeof id);
    console.log('🔍 ID length:', id.length);
    
    try {
      // First, check if the ID is a valid ObjectId format
      const { Types } = require('mongoose');
      
      if (!Types.ObjectId.isValid(id)) {
        console.log('❌ Invalid ObjectId format:', id);
        return null;
      }

      // Try to find by the ID as-is first
      let user = await this.userModel.findById(id).exec();
      console.log('🔍 Direct findById result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        // If not found, try creating a new ObjectId and searching
        try {
          const objectId = new Types.ObjectId(id);
          console.log('🔍 Trying with new ObjectId:', objectId.toString());
          user = await this.userModel.findById(objectId).exec();
          console.log('🔍 ObjectId findById result:', user ? 'Found' : 'Not found');
        } catch (objError) {
          console.log('❌ ObjectId creation failed:', objError.message);
        }
      }
      
      if (!user) {
        // Last resort: try to find by string comparison in a query
        console.log('🔍 Trying string comparison search...');
        user = await this.userModel.findOne({ 
          $or: [
            { _id: id },
            { _id: new Types.ObjectId(id) }
          ]
        }).exec();
        console.log('🔍 String comparison result:', user ? 'Found' : 'Not found');
      }
      
      if (user) {
        console.log('✅ User found:', {
          dbId: user._id,
          dbIdString: user._id.toString(),
          email: user.email,
          role: user.role,
          idMatch: user._id.toString() === id
        });
        return this.toUserType(user);
      } else {
        console.log('❌ User not found with any method for ID:', id);
        
        // Debug: Show what IDs actually exist
        const allUsers = await this.userModel.find({}).limit(5).exec();
        console.log('📋 Sample of existing user IDs:');
        allUsers.forEach(u => {
          console.log(`  - ${u._id.toString()} (${u.email}) - matches: ${u._id.toString() === id}`);
        });
        
        return null;
      }
    } catch (error) {
      console.error('❌ Error in findById:', error.message);
      throw error;
    }
  }

  // ===== PASSWORD METHODS =====
  async updatePassword(userId: string, hashedPassword: string): Promise<UserType> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    ).exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    return this.toUserType(updatedUser);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      console.log(`🔍 Comparing password for hashed: ${hashedPassword.substring(0, 20)}...`);
      console.log(`🔍 Plain password: ${plainPassword}`);
      
      // Check if the stored password is actually hashed
      if (!hashedPassword.startsWith('$2b$')) {
        console.log('⚠️ Password appears to be unhashed, comparing directly');
        return hashedPassword === plainPassword;
      }
      
      const result = await bcrypt.compare(plainPassword, hashedPassword);
      console.log(`🔍 Password comparison result: ${result}`);
      return result;
    } catch (error) {
      console.error('❌ Password comparison error:', error);
      return false;
    }
  }

  // ===== DEBUG METHODS =====
  async getAllUsersForDebug(): Promise<UserType[]> {
    const users = await this.userModel.find({}).exec();
    return users.map(user => this.toUserType(user));
  }

  // ===== ADMIN METHODS =====
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
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    return this.toUserType(updatedUser);
  }

  async unbanUser(userId: string): Promise<UserType> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        isBlocked: false,
        $unset: {
          banReason: "",
          bannedBy: "",
          bannedAt: "",
          banUntil: ""
        }
      },
      { new: true }
    ).exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    return this.toUserType(updatedUser);
  }

  async updateUserRole(userId: string, role: string): Promise<UserType> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
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
        $sort: { _id: 1 as 1 }
      }
    ];

    try {
      return await this.userModel.aggregate(pipeline).exec();
    } catch (error) {
      console.error('Error in getUserGrowthData:', error);
      return [];
    }
  }

  // ===== FIX ADMIN PASSWORD METHOD =====
  async fixAdminPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Hash the new password properly
      const hashedPassword = await this.hashPassword(newPassword);
      
      // Update the user's password
      await this.userModel.findByIdAndUpdate(user._id, { 
        password: hashedPassword 
      }).exec();

      console.log(`✅ Password updated for ${email}`);
      console.log(`🔑 New hash: ${hashedPassword.substring(0, 20)}...`);

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('❌ Error fixing admin password:', error);
      return {
        success: false,
        message: error.message
      };
    }
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

  async getUsernameById(userId: string): Promise<string | null> {
    const user = await this.userModel.findById(userId).select('username').lean();
    return user ? user.username : null;
  }

  async getUsernamesByIds(userIds: string[]): Promise<Map<string, string>> {
    const users = await this.userModel.find({ _id: { $in: userIds } }).select('_id username').lean();
    const usernameMap = new Map<string, string>();
    users.forEach(user => {
      usernameMap.set(user._id.toString(), user.username);
    });
    return usernameMap;
  }
}