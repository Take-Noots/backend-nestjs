import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SongPostController } from './songPost.controller';
import { SongPostService } from './songPost.service';
import { SongPost, SongPostSchema } from './songPost.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SongPost.name, schema: SongPostSchema },
    ]),
  ],
  controllers: [SongPostController],
  providers: [SongPostService],
  exports: [SongPostService, MongooseModule],
})
export class SongPostModule {}
