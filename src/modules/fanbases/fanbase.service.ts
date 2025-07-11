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
    const fanbase = await this.fanbaseModel.findOne({ name, isDeleted: { $ne: true } }).exec();
    return fanbase ? this.toFanbaseType(fanbase) : null;
  }

  // ===== ADMIN FUNCTIONALITY - PAGINATION AND FILTERING =====
  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10): Promise<FanbaseType[]> {
    const fanbases = await this.fanbaseModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email')
      .populate('moderators', 'username')
      .exec();
    return fanbases.map(fanbase => this.toFanbaseType(fanbase));
  }

  async countFanbases(filter: any = {}): Promise<number> {
    return await this.fanbaseModel.countDocuments(filter).exec();
  }

  // ===== ADMIN FUNCTIONALITY - CONTENT MODERATION =====
  async deleteFanbase(fanbaseId: string, deletedBy: string, reason: string): Promise<FanbaseType> {
    const updatedFanbase = await this.fanbaseModel.findByIdAndUpdate(
      fanbaseId,
      {
        isDeleted: true,
        deletedReason: reason,
        deletedBy: deletedBy,
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!updatedFanbase) {
      throw new NotFoundException(`Fanbase with ID ${fanbaseId} not found`);
    }
    
    return this.toFanbaseType(updatedFanbase);
  }

  async restoreFanbase(fanbaseId: string): Promise<FanbaseType> {
    const updatedFanbase = await this.fanbaseModel.findByIdAndUpdate(
      fanbaseId,
      {
        $unset: {
          isDeleted: 1,
          deletedReason: 1,
          deletedBy: 1
        },
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!updatedFanbase) {
      throw new NotFoundException(`Fanbase with ID ${fanbaseId} not found`);
    }
    
    return this.toFanbaseType(updatedFanbase);
  }

  async toggleFanbaseStatus(fanbaseId: string, isActive: boolean): Promise<FanbaseType> {
    const updatedFanbase = await this.fanbaseModel.findByIdAndUpdate(
      fanbaseId,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).exec();
    
    if (!updatedFanbase) {
      throw new NotFoundException(`Fanbase with ID ${fanbaseId} not found`);
    }
    
    return this.toFanbaseType(updatedFanbase);
  }

  // ===== ADMIN FUNCTIONALITY - METRICS =====
  async countRecentFanbases(days: number): Promise<number> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return await this.fanbaseModel.countDocuments({
      createdAt: { $gte: dateFrom },
      isDeleted: { $ne: true }
    }).exec();
  }

  async getFanbaseGrowthData(days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: dateFrom },
          isDeleted: { $ne: true }
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
        $sort: { "_id": 1 }
      }
    ] as any[];

    return await this.fanbaseModel.aggregate(pipeline).exec();
  }

  async getTopFanbases(limit: number = 10): Promise<FanbaseType[]> {
    const fanbases = await this.fanbaseModel.find({ 
      isDeleted: { $ne: true }, 
      isActive: true 
    })
      .sort({ membersCount: -1, postsCount: -1 })
      .limit(limit)
      .populate('createdBy', 'username')
      .exec();
    return fanbases.map(fanbase => this.toFanbaseType(fanbase));
  }

  private toFanbaseType(fanbase: FanbaseDocument): FanbaseType {
    return {
      _id: fanbase._id.toString(),
      name: fanbase.name,
      description: fanbase.description,
      createdBy: fanbase.createdBy?.toString(),
      imageUrl: fanbase.imageUrl,
      category: fanbase.category,
      membersCount: fanbase.membersCount || 0,
      postsCount: fanbase.postsCount || 0,
      moderators: Array.isArray(fanbase.moderators) 
        ? fanbase.moderators.map(mod => mod.toString()) 
        : [],
      visibility: fanbase.visibility,
      isActive: fanbase.isActive,
      isDeleted: fanbase.isDeleted,
      deletedReason: fanbase.deletedReason,
      deletedBy: fanbase.deletedBy?.toString(),
      createdAt: fanbase.createdAt,
      updatedAt: fanbase.updatedAt,
    };
  }
}
