// src/modules/reports/report.controller.ts
import { Controller, Get, Post, Param, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDTO } from './dto/create-report.dto';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async createReport(@Body() createReportDto: CreateReportDTO) {
    try {
      return await this.reportService.create(createReportDto);
    } catch (error) {
      throw new HttpException(
        `Failed to create report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getReportById(@Param('id') id: string) {
    try {
      const report = await this.reportService.findById(id);
      if (!report) {
        throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
      }
      return report;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async getAllReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    try {
      const skip = (page - 1) * limit;
      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;
      
      return await this.reportService.findAllWithPagination(filter, skip, limit);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/overview')
  async getReportStats() {
    try {
      return await this.reportService.getReportStats();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch report stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('high-priority/:limit')
  async getHighPriorityReports(@Param('limit') limit: number = 20) {
    try {
      return await this.reportService.getHighPriorityReports(limit);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch high priority reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}