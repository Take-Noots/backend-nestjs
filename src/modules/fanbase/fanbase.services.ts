import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fanbase } from './entities/fanbase.entity';
import { CreateFanbaseDto } from './dto/create-fanbase.dto';

@Injectable()
export class FanbaseService {
  constructor(
    @InjectModel(Fanbase.name) private fanbaseModel: Model<Fanbase>,
  ) {}

  async findAll(): Promise<Fanbase[]> {
    return this.fanbaseModel.find().exec();
  }

  async findOne(id: string): Promise<Fanbase | null> {
    return this.fanbaseModel.findById(id).exec();
  }

  async create(dto: CreateFanbaseDto): Promise<Fanbase> {
    const created = new this.fanbaseModel(dto);
    return created.save();
  }

  async toggleJoin(id: string, userId: string): Promise<Fanbase> {
    const fanbase = await this.fanbaseModel.findById(id).exec();
    if (!fanbase) throw new Error('Fanbase not found');

    const index = fanbase.likedUserIds.indexOf(userId);
    if (index === -1) {
      fanbase.likedUserIds.push(userId);
      fanbase.numberOfLikes += 1;
    } else {
      fanbase.likedUserIds.splice(index, 1);
      fanbase.numberOfLikes -= 1;
    }

    return fanbase.save();
  }
}
