import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fanbase } from './entities/fanbase.entity';
import { CreateFanbaseDto } from './dto/create-fanbase.dto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

@Injectable()
export class FanbaseService {
  constructor(@InjectModel(Fanbase.name) private fanbaseModel: Model<Fanbase>) {}

  async create(createFanbaseDto: CreateFanbaseDto): Promise<Fanbase> {
    const fanbase = new this.fanbaseModel(createFanbaseDto);
    return fanbase.save();
  }

  async findAll(): Promise<Fanbase[]> {
    return this.fanbaseModel.find().exec();
  }

  async findOne(id: string): Promise<Fanbase> {
    const fanbase = await this.fanbaseModel.findById(id).exec();
    if (!fanbase) {
      throw new NotFoundException(`Fanbase with ID ${id} not found`);
    }
    return fanbase;
  }
}
