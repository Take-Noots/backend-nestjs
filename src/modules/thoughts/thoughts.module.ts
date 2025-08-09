import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThoughtsController } from './thoughts.controller';
import { ThoughtsService } from './thoughts.service';
import { ThoughtsPost, ThoughtsPostSchema } from './thoughts.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ThoughtsPost.name, schema: ThoughtsPostSchema },
    ]),
  ],
  controllers: [ThoughtsController],
  providers: [ThoughtsService],
  exports: [ThoughtsService],
})
export class ThoughtsModule {}
