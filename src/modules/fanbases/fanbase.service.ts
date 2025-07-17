// src/modules/fanbases/fanbase.service.ts
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Fanbase, FanbaseDocument } from './fanbase.model';
import { CreateFanbaseDTO } from './dto/create-fanbase.dto';
import { FanbaseType } from '../../common/interfaces/fanbase.interface';

@Injectable()
export class FanbaseService {
  constructor(@InjectModel(Fanbase.name) private fanbaseModel: Model<FanbaseDocument>) {}

  async create(createFanbaseDto: CreateFanbaseDTO): Promise<FanbaseType> {
    const createdFanbase = new this.fanbaseModel(createFanbaseDto);
    const savedFanbase = await createdFanbase.save();
    return this.toFanbaseType(savedFanbase);
  }

  async findById(id: string): Promise<FanbaseType | null> {
    const fanbase = await this.fanbaseModel.findById(id).exec();
    return fanbase ? this.toFanbaseType(fanbase) : null;
  }

  async findByName(name: string): Promise<FanbaseType | null> {
    const fanbase = await this.fanbaseModel.findOne({ fanbaseName: name }).exec();
    return fanbase ? this.toFanbaseType(fanbase) : null;
  }

  // ===== BASIC CRUD OPERATIONS =====
  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10): Promise<FanbaseType[]> {
    const fanbases = await this.fanbaseModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    return fanbases.map(fanbase => this.toFanbaseType(fanbase));
  }

  async countFanbases(filter: any = {}): Promise<number> {
    return await this.fanbaseModel.countDocuments(filter).exec();
  }

  async getTopFanbases(limit: number = 10): Promise<FanbaseType[]> {
    const fanbases = await this.fanbaseModel.find()
      .sort({ numberOfLikes: -1, numberOfPosts: -1, numberOfComments: -1 })
      .limit(limit)
      .exec();
    return fanbases.map(fanbase => this.toFanbaseType(fanbase));
  }

  private toFanbaseType(fanbase: FanbaseDocument): FanbaseType {
    return {
      _id: fanbase._id.toString(),
      fanbaseName: fanbase.fanbaseName,
      topic: fanbase.topic,
      createdUserId: fanbase.createdUserId,
      fanbasePhotoUrl: fanbase.fanbasePhotoUrl,
      numberOfLikes: fanbase.numberOfLikes || 0,
      likedUserIds: fanbase.likedUserIds || [],
      numberOfPosts: fanbase.numberOfPosts || 0,
      postIds: fanbase.postIds || [],
      numberOfComments: fanbase.numberOfComments || 0, // Added numberOfComments
      createdAt: fanbase.createdAt,
      __v: fanbase.__v,
    };
  }
}