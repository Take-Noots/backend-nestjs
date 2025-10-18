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
import { CreatePostReportDto, UpdatePostReportDto, ReviewPostReportDto } from './dto/post_report.dto';
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

  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async reviewReport(
    @Param('id') id: string,
    @Body() reviewData: ReviewPostReportDto,
    @Request() req,
  ) {
    const report = await this.postReportService.reviewReport(
      id,
      reviewData,
      req.user.userId,
    );
    return {
      success: true,
      message: `Report ${reviewData.status} successfully`,
      data: report,
    };
  }

  @Get('status/:status')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getReportsByStatus(@Param('status') status: string) {
    const reports = await this.postReportService.getReportsByStatus(status);
    return {
      success: true,
      data: reports,
    };
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getPendingReports() {
    const reports = await this.postReportService.getPendingReports();
    return {
      success: true,
      data: reports,
    };
  }

  @Get('posts/reported')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getReportedPosts() {
    const reportedPosts = await this.postReportService.getReportedPostsWithDetails();
    return {
      success: true,
      data: reportedPosts,
    };
  }

  @Get('post/:postId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  async getReportsByPostId(@Param('postId') postId: string) {
    const reports = await this.postReportService.getReportsByPostId(postId);
    return {
      success: true,
      data: reports,
    };
  }
}
