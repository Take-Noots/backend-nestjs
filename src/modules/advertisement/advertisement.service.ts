import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Advertisement, AdvertisementDocument } from './advertisement.model';
import { CreateAdvertisementDTO } from './dto/create-advertisement.dto';

@Injectable()
export class AdvertisementService {
  constructor(@InjectModel(Advertisement.name) private advertisementModel: Model<AdvertisementDocument>) {}

  async create(createAdvertisementDto: CreateAdvertisementDTO): Promise<Advertisement> {
    const advertisementData = { ...createAdvertisementDto, status: 0 };
    const createdAdvertisement = new this.advertisementModel(advertisementData);
    return await createdAdvertisement.save();
  }

  async findById(id: string): Promise<Advertisement | null> {
    return await this.advertisementModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<Advertisement[]> {
    return await this.advertisementModel.find({ userId }).exec();
  }

  async findAll(): Promise<Advertisement[]> {
    return await this.advertisementModel.find().exec();
  }

  async delete(id: string): Promise<Advertisement | null> {
    return await this.advertisementModel.findByIdAndDelete(id).exec();
  }

  async updateById(id: string, updateData: Partial<Advertisement>): Promise<Advertisement | null> {
    console.log(`🔄 AdvertisementService.updateById - ID: ${id}, updateData:`, updateData);

    const result = await this.advertisementModel.findByIdAndUpdate(id, updateData, { new: true }).exec();

    if (result) {
      console.log(`✅ Advertisement updated successfully in database:`, {
        id: result._id,
        title: result.title,
        status: result.status,
        updatedAt: result.updatedAt
      });
    } else {
      console.log(`❌ Advertisement update failed - document not found: ${id}`);
    }

    return result;
  }
}
