import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostReportService } from './post_report.service';
import { CreatePostReportDto, UpdatePostReportDto } from './dto/post_report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('post-reports')
@UseGuards(JwtAuthGuard)
export class PostReportController {
  constructor(private readonly postReportService: PostReportService) {}

  @Post()
  async createReport(
    @Request() req,
    @Body() createPostReportDto: CreatePostReportDto,
  ) {
    const report = await this.postReportService.createReport(
      req.user.userId,
      createPostReportDto,
    );
    return {
      success: true,
      message: 'Report submitted successfully',
      data: report,
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getAllReports() {
    const reports = await this.postReportService.findAllReports();
    return {
      success: true,
      data: reports,
    };
  }

  @Get('my-reports')
  async getMyReports(@Request() req) {
    const reports = await this.postReportService.getReportsByReporter(
      req.user.userId,
    );
    return {
      success: true,
      data: reports,
    };
  }

  @Get('reported-user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getReportsByUser(@Param('userId') userId: string) {
    const reports = await this.postReportService.getReportsByUser(userId);
    return {
      success: true,
      data: reports,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getReportById(@Param('id') id: string) {
    const report = await this.postReportService.findReportById(id);
    return {
      success: true,
      data: report,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async updateReport(
    @Param('id') id: string,
    @Body() updatePostReportDto: UpdatePostReportDto,
  ) {
    const report = await this.postReportService.updateReport(
      id,
      updatePostReportDto,
    );
    return {
      success: true,
      message: 'Report updated successfully',
      data: report,
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async deleteReport(@Param('id') id: string) {
    await this.postReportService.deleteReport(id);
    return {
      success: true,
      message: 'Report deleted successfully',
    };
  }
}
