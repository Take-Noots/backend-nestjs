// src/modules/reports/report.service.ts
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from './report.model';
import { CreateReportDTO } from './dto/create-report.dto';
import { ResolveReportDTO } from './dto/resolve-report.dto';
import { ReportType } from '../../common/interfaces/report.interface';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<ReportDocument>) {}

  async create(createReportDto: CreateReportDTO): Promise<ReportType> {
    const createdReport = new this.reportModel(createReportDto);
    const savedReport = await createdReport.save();
    return this.toReportType(savedReport);
  }

  async findById(id: string): Promise<ReportType | null> {
    const report = await this.reportModel.findById(id).exec();
    return report ? this.toReportType(report) : null;
  }

  // ===== ADMIN FUNCTIONALITY - PAGINATION AND FILTERING =====
  async findAllWithPagination(filter: any = {}, skip: number = 0, limit: number = 10): Promise<ReportType[]> {
    const reports = await this.reportModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ priority: -1, createdAt: -1 })
      .populate('reportedBy', 'username email')
      .populate('reportedUserId', 'username email')
      .populate('reviewedBy', 'username')
      .exec();
    return reports.map(report => this.toReportType(report));
  }

  async countReports(filter: any = {}): Promise<number> {
    return await this.reportModel.countDocuments(filter).exec();
  }

  // ===== ADMIN FUNCTIONALITY - REPORT MANAGEMENT =====
  async updateReportStatus(reportId: string, status: string, reviewedBy?: string): Promise<ReportType> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    const updatedReport = await this.reportModel.findByIdAndUpdate(
      reportId,
      updateData,
      { new: true }
    ).exec();
    
    if (!updatedReport) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }
    
    return this.toReportType(updatedReport);
  }

  async resolveReport(reportId: string, resolveData: ResolveReportDTO): Promise<ReportType> {
    const updatedReport = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        status: 'resolved',
        resolution: resolveData.resolution,
        actionTaken: resolveData.actionTaken,
        reviewNotes: resolveData.reviewNotes,
        reviewedBy: resolveData.reviewedBy,
        resolvedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!updatedReport) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }
    
    return this.toReportType(updatedReport);
  }

  async dismissReport(reportId: string, reviewedBy: string, reason: string): Promise<ReportType> {
    const updatedReport = await this.reportModel.findByIdAndUpdate(
      reportId,
      {
        status: 'dismissed',
        resolution: 'dismissed',
        reviewNotes: reason,
        reviewedBy: reviewedBy,
        resolvedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
    
    if (!updatedReport) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }
    
    return this.toReportType(updatedReport);
  }

  // ===== ADMIN FUNCTIONALITY - METRICS =====
  async getReportStats(): Promise<any> {
    try {
      const statusPipeline = [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ];

      const categoryPipeline = [
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ];

      const [statusCounts, categoryCounts] = await Promise.all([
        this.reportModel.aggregate(statusPipeline).exec(),
        this.reportModel.aggregate(categoryPipeline).exec()
      ]);

      return {
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
        byCategory: categoryCounts.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error in getReportStats:', error);
      return { byStatus: {}, byCategory: {} };
    }
  }

  async countRecentReports(days: number): Promise<number> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    return await this.reportModel.countDocuments({
      createdAt: { $gte: dateFrom }
    }).exec();
  }

  async getReportGrowthData(days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: dateFrom }
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
        $sort: { _id: 1 as 1 }
      }
    ];

    try {
      return await this.reportModel.aggregate(pipeline).exec();
    } catch (error) {
      console.error('Error in getReportGrowthData:', error);
      return [];
    }
  }

  async getHighPriorityReports(limit: number = 20): Promise<ReportType[]> {
    const reports = await this.reportModel.find({ 
      status: { $in: ['pending', 'under_review'] },
      priority: { $gte: 2 }
    })
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit)
      .populate('reportedBy', 'username')
      .populate('reportedUserId', 'username')
      .exec();
    return reports.map(report => this.toReportType(report));
  }

  private toReportType(report: ReportDocument): ReportType {
    return {
      _id: report._id.toString(),
      reportedBy: report.reportedBy?.toString(),
      contentType: report.contentType,
      contentId: report.contentId?.toString(),
      reportedUserId: report.reportedUserId?.toString(),
      reason: report.reason,
      description: report.description,
      category: report.category,
      status: report.status,
      reviewedBy: report.reviewedBy?.toString(),
      resolution: report.resolution,
      actionTaken: report.actionTaken,
      reviewNotes: report.reviewNotes,
      resolvedAt: report.resolvedAt,
      priority: report.priority || 1,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }
}