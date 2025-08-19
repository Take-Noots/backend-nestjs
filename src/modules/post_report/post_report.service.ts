import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PostReport, PostReportDocument } from './post_report.model';
import { CreatePostReportDto, UpdatePostReportDto } from './dto/post_report.dto';

@Injectable()
export class PostReportService {
  constructor(
    @InjectModel(PostReport.name)
    private postReportModel: Model<PostReportDocument>,
  ) {}

  async createReport(
    reporterId: string,
    createPostReportDto: CreatePostReportDto,
  ): Promise<PostReport> {
    const report = new this.postReportModel({
      reporterId: reporterId,
      reportedUserId: createPostReportDto.reportedUserId,
      reportedPostId: createPostReportDto.reportedPostId,
      reason: createPostReportDto.reason,
      reportTime: new Date(),
    });

    return await report.save();
  }

  async findAllReports(): Promise<PostReport[]> {
    return await this.postReportModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }



  async findReportById(id: string): Promise<PostReport> {
    const report = await this.postReportModel
      .findById(id)
      .exec();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async updateReport(
    id: string,
    updatePostReportDto: UpdatePostReportDto,
  ): Promise<PostReport> {
    const report = await this.postReportModel
      .findByIdAndUpdate(id, updatePostReportDto, { new: true })
      .exec();

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async deleteReport(id: string): Promise<void> {
    const result = await this.postReportModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Report not found');
    }
  }

  async getReportsByUser(userId: string): Promise<PostReport[]> {
    return await this.postReportModel
      .find({ reportedUserId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getReportsByReporter(reporterId: string): Promise<PostReport[]> {
    return await this.postReportModel
      .find({ reporterId: reporterId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
