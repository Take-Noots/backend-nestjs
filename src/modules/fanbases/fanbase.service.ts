import { Model } from 'mongoose';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Fanbase, FanbaseDocument } from './fanbase.model';
import { User, UserDocument } from '../user/user.model';
import { CreateFanbaseDTO } from './dto/create-fanbase.dto';
import { FanbaseType } from '../../common/interfaces/fanbase.interface';

@Injectable()
export class FanbaseService {
  constructor(
    @InjectModel(Fanbase.name) private fanbaseModel: Model<FanbaseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(createFanbaseDto: CreateFanbaseDTO, userId: string): Promise<FanbaseType> {
    try {
      console.log('FanbaseService.create called with:', { createFanbaseDto, userId });
      
      // Get user details for additional context
      const user = await this.userModel.findById(userId).exec();
      console.log('User found:', user ? `${user.username} (${user._id})` : 'null');
      
      if (!user) {
        throw new Error('User not found');
      }

      const fanbaseData = {
        fanbaseName: createFanbaseDto.fanbaseName,
        topic: createFanbaseDto.topic,
        fanbasePhotoUrl: createFanbaseDto.fanbasePhotoUrl,
        createdAt: new Date(),
        createdBy: {
          _id: user._id.toString(),
          username: user.username
        },
        numberOfLikes: 0,
        numberOfPosts: 0,
        numberOfShares: 0,
        joinedUserIds: [], 
        likedUserIds: [],
        postIds: []
      };

      console.log('Creating fanbase with data:', fanbaseData);

      const createdFanbase = new this.fanbaseModel(fanbaseData);
      const savedFanbase = await createdFanbase.save();
      
      console.log('Fanbase saved successfully:', savedFanbase._id);

      return this.toFanbaseType(savedFanbase);
    } catch (error) {
      console.error('Error in FanbaseService.create:', error);
      throw new Error(`Failed to create fanbase: ${error.message}`);
    }
  }

  async isOwner(fanbaseId: string, userId: string): Promise<boolean> {
    try {
      const fanbase = await this.fanbaseModel.findById(fanbaseId).exec();
      if (!fanbase) {
        throw new NotFoundException('Fanbase not found');
      }
      return fanbase.createdBy._id.toString() === userId;
    } catch (error) {
      throw new Error(`Failed to check ownership: ${error.message}`);
    }
  }

  async findById(id: string, userId?: string): Promise<FanbaseType | null> {
    try {
      const fanbase = await this.fanbaseModel.findById(id).exec();
      if (!fanbase) return null;

      return this.toFanbaseType(fanbase, userId);
    } catch {
      return null;
    }
  }

  async findByName(name: string, userId?: string): Promise<FanbaseType | null> {
    try {
      const fanbase = await this.fanbaseModel.findOne({ fanbaseName: name }).exec();
      if (!fanbase) return null;

      return this.toFanbaseType(fanbase, userId);
    } catch {
      return null;
    }
  }

  async joinFanbase(fanbaseId: string, userId: string): Promise<FanbaseType> {
    try {
      const fanbase = await this.fanbaseModel.findById(fanbaseId).exec();
      console.log(`Fanbase found: ${fanbase ? fanbase.fanbaseName : 'not found'}`);
      if (!fanbase) {
        throw new NotFoundException('Fanbase not found');
      }
      console.log(`User ${userId} attempting to join fanbase ${fanbaseId}`);

      const userIsJoined = fanbase.joinedUserIds.includes(userId);
      console.log(`User is already joined: ${userIsJoined}`);
      if (userIsJoined) {
        // If user is already joined, remove them from joinedUserIds
        console.log(`User ${userId} is already a member of fanbase ${fanbaseId}`);
        fanbase.joinedUserIds = fanbase.joinedUserIds.filter(id => id !== userId); 
        console.log(`User ${userId} removed from joinedUserIds`);

        const updatedFanbase = await fanbase.save();
        return this.toFanbaseType(updatedFanbase, userId);
      }else{
        // If user is not joined, add them to joinedUserIds
        fanbase.joinedUserIds.push(userId);
        console.log(`User ${userId} added to joinedUserIds`);

        const updatedFanbase = await fanbase.save();
        return this.toFanbaseType(updatedFanbase, userId);
      }
        // throw new Error('User has already joined this fanbase');
      } catch (error) {
      throw new Error(`Failed to join fanbase: ${error.message}`);
    }
  }

  async likeFanbase(fanbaseId: string, userId: string): Promise<FanbaseType> {
    try {
      const fanbase = await this.fanbaseModel.findById(fanbaseId).exec();
      if (!fanbase) {
        throw new NotFoundException('Fanbase not found');
      }

      const userHasLiked = fanbase.likedUserIds.includes(userId);
      if (userHasLiked) {
        // If user has already liked, remove them from likedUserIds
        fanbase.likedUserIds = fanbase.likedUserIds.filter(id => id !== userId);
        fanbase.numberOfLikes -= 1;
      } else {
        // If user has not liked, add them to likedUserIds
        fanbase.likedUserIds.push(userId);
        fanbase.numberOfLikes += 1;
      }

      const updatedFanbase = await fanbase.save();
      return this.toFanbaseType(updatedFanbase, userId);
    } catch (error) {
      throw new Error(`Failed to like fanbase: ${error.message}`);
    }
  }

  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10, userId?: string): Promise<FanbaseType[]> {
    try {
      const fanbases = await this.fanbaseModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      return fanbases.map(fanbase => this.toFanbaseType(fanbase, userId));
    } catch (error) {
      throw new Error(`Failed to fetch fanbases: ${error.message}`);
    }
  }

  async getTopFanbases(limit: number = 10, userId?: string): Promise<FanbaseType[]> {
    try {
      const fanbases = await this.fanbaseModel.find()
        .sort({ numberOfLikes: -1, numberOfPosts: -1, numberOfShares: -1 })
        .limit(limit)
        .exec();

      return fanbases.map(fanbase => this.toFanbaseType(fanbase, userId));
    } catch (error) {
      throw new Error(`Failed to fetch top fanbases: ${error.message}`);
    }
  }

  async countFanbases(filter: any = {}): Promise<number> {
    return await this.fanbaseModel.countDocuments(filter).exec();
  }

  async addOrUpdateRules(fanbaseId: string, rules: { rule: string }[], userId: string) {
    const fanbase = await this.fanbaseModel.findById(fanbaseId);
    
    if (!fanbase) {
      throw new NotFoundException('Fanbase not found');
    }

    // Extract owner ID from createdBy (handles both object and string formats)
    const createdByObj = fanbase.createdBy as any;
    const ownerId = typeof createdByObj === 'object' && createdByObj?._id
      ? (typeof createdByObj._id === 'string' ? createdByObj._id : createdByObj._id.toString())
      : createdByObj?.toString();

    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('Only the fanbase owner can add or update rules');
    }

    fanbase.rules = rules;
    await fanbase.save();
    
    return fanbase;
  }

  async getRules(fanbaseId: string) {
    const fanbase = await this.fanbaseModel.findById(fanbaseId);
    return fanbase?.rules || [];
  }

  async removeRule(fanbaseId: string, ruleIndex: number, userId: string) {
    const fanbase = await this.fanbaseModel.findById(fanbaseId);
    
    if (!fanbase) {
      throw new NotFoundException('Fanbase not found');
    }

    // Extract owner ID from createdBy (handles both object and string formats)
    const createdByObj = fanbase.createdBy as any;
    const ownerId = typeof createdByObj === 'object' && createdByObj?._id
      ? (typeof createdByObj._id === 'string' ? createdByObj._id : createdByObj._id.toString())
      : createdByObj?.toString();

    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('Only the fanbase owner can remove rules');
    }

    if (ruleIndex < 0 || ruleIndex >= fanbase.rules.length) {
      throw new NotFoundException('Rule not found at specified index');
    }

    fanbase.rules.splice(ruleIndex, 1); // Remove rule at specific index
    await fanbase.save();
    
    return fanbase;
  }

  async deleteFanbase(fanbaseId: string, userId: string): Promise<void> {
    const fanbase = await this.fanbaseModel.findById(fanbaseId);
    
    if (!fanbase) {
      throw new NotFoundException('Fanbase not found');
    }
    
    // Extract owner ID from createdBy (handles both object and string formats)
    const createdByObj = fanbase.createdBy as any;
    const ownerId = typeof createdByObj === 'object' && createdByObj?._id
      ? (typeof createdByObj._id === 'string' ? createdByObj._id : createdByObj._id.toString())
      : createdByObj?.toString();
      
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('Only the fanbase owner can delete the fanbase');
    }
    fanbase.isDeleted = true;
    await fanbase.save();
  }

  private toFanbaseType(fanbase: FanbaseDocument, userId?: string): FanbaseType {
    return {
      _id: fanbase._id.toString(),
      fanbaseName: fanbase.fanbaseName,
      topic: fanbase.topic,
      fanbasePhotoUrl: fanbase.fanbasePhotoUrl,
      numberOfLikes: fanbase.numberOfLikes || 0,
      likedUserIds: fanbase.likedUserIds || [],
      isLiked: userId ? fanbase.likedUserIds.includes(userId) : false,
      numberOfPosts: fanbase.numberOfPosts || 0,
      postIds: fanbase.postIds || [],
      joinedUserIds: fanbase.joinedUserIds || [],
      isJoined: userId ? fanbase.joinedUserIds.includes(userId) : false, // Check if the creator is in joinedUserIds
      numberOfShares: fanbase.numberOfShares || 0,
      createdAt: fanbase.createdAt,
      createdBy: {
        _id: fanbase.createdBy?._id || 'unknown',
        username: fanbase.createdBy?.username || 'Unknown User',
      },
      isDeleted: fanbase.isDeleted || false,
      rules: fanbase.rules || [],
    };
  }
}