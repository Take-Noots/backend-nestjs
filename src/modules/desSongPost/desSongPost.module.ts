import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DesSongPostController } from './desSongPost.controller';
import { DesSongPostService } from './desSongPost.service';
import { DesSongPost, DesSongPostSchema } from './desSongPost.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DesSongPost.name, schema: DesSongPostSchema }]),
  ],
  controllers: [DesSongPostController],
  providers: [DesSongPostService],
})
export class DesSongPostModule {}
