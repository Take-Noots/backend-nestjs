// src/modules/fanbases/fanbase.service.ts
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
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

      // Create fanbase with enriched data - backend controls all user-related fields
      const fanbaseData = {
        fanbaseName: createFanbaseDto.fanbaseName,
        topic: createFanbaseDto.topic,
        fanbasePhotoUrl: createFanbaseDto.fanbasePhotoUrl,
        createdAt: new Date(),
        // Store user info directly in the document now
        createdBy: {
          _id: user._id.toString(),
          username: user.username
        },
        // Initialize counters
        numberOfLikes: 0,
        numberOfPosts: 0,
        numberOfShares: 0,
        likedUserIds: [],
        postIds: []
      };

      console.log('Creating fanbase with data:', fanbaseData);

      const createdFanbase = new this.fanbaseModel(fanbaseData);
      const savedFanbase = await createdFanbase.save();
      
      console.log('Fanbase saved successfully:', savedFanbase._id);
      
      // Return the fanbase - user info is already included
      return this.toFanbaseType(savedFanbase);
    } catch (error) {
      console.error('Error in FanbaseService.create:', error);
      throw new Error(`Failed to create fanbase: ${error.message}`);
    }
  }

  async findById(id: string): Promise<FanbaseType | null> {
    try {
      const fanbase = await this.fanbaseModel.findById(id).exec();
      if (!fanbase) return null;

      return this.toFanbaseType(fanbase);
    } catch (error) {
      return null;
    }
  }

  async findByName(name: string): Promise<FanbaseType | null> {
    try {
      const fanbase = await this.fanbaseModel.findOne({ fanbaseName: name }).exec();
      if (!fanbase) return null;

      return this.toFanbaseType(fanbase);
    } catch (error) {
      return null;
    }
  }

  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10): Promise<FanbaseType[]> {
    try {
      const fanbases = await this.fanbaseModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec();

      return fanbases.map(fanbase => this.toFanbaseType(fanbase));
    } catch (error) {
      throw new Error(`Failed to fetch fanbases: ${error.message}`);
    }
  }

  async getTopFanbases(limit: number = 10): Promise<FanbaseType[]> {
    try {
      const fanbases = await this.fanbaseModel.find()
        .sort({ numberOfLikes: -1, numberOfPosts: -1, numberOfShares: -1 })
        .limit(limit)
        .exec();

      return fanbases.map(fanbase => this.toFanbaseType(fanbase));
    } catch (error) {
      throw new Error(`Failed to fetch top fanbases: ${error.message}`);
    }
  }

  async countFanbases(filter: any = {}): Promise<number> {
    return await this.fanbaseModel.countDocuments(filter).exec();
  }

  private toFanbaseType(fanbase: FanbaseDocument): FanbaseType {
    return {
      _id: fanbase._id.toString(),
      fanbaseName: fanbase.fanbaseName,
      topic: fanbase.topic,
      fanbasePhotoUrl: fanbase.fanbasePhotoUrl,
      numberOfLikes: fanbase.numberOfLikes || 0,
      likedUserIds: fanbase.likedUserIds || [],
      numberOfPosts: fanbase.numberOfPosts || 0,
      postIds: fanbase.postIds || [],
      numberOfShares: fanbase.numberOfShares || 0,
      createdAt: fanbase.createdAt,
      createdBy: {
        _id: fanbase.createdBy?._id || 'unknown',
        username: fanbase.createdBy?.username || 'Unknown User',
      }
    };
  }
}