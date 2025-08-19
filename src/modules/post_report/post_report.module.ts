import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostReportController } from './post_report.controller';
import { PostReportService } from './post_report.service';
import { PostReport, PostReportSchema } from './post_report.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PostReport.name, schema: PostReportSchema },
    ]),
  ],
  controllers: [PostReportController],
  providers: [PostReportService],
  exports: [PostReportService],
})
export class PostReportModule {}
