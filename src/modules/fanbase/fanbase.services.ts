import { Injectable } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fanbase } from './entities/fanbase.entity';
import { CreateFanbaseDto } from './dto/create-fanbase.dto';

@Injectable()
export class FanbaseService {
    // This service will handle all fanbase related logic
    // For now, it is empty and will be filled in later
    // You can add methods here to handle specific logic
    // For example, you can add a method to get fanbase data

    constructor(
        @InjectModel(Fanbase.name)
        private fanbaseModel: Model<Fanbase>,
    ) {}

    async create(createFanbaseDto: CreateFanbaseDto): Promise<Fanbase> {
        const fanbase = new this.fanbaseModel(createFanbaseDto);
        return fanbase.save();
    }

    // Future: find, join, like, comment, share methods
}

