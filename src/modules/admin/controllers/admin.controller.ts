import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Body, 
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Request
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { BanUserDto } from '../dto/ban-user.dto';
import { DeletePostDTO } from '../../posts/dto/delete-post.dto';
import { DeleteFanbaseDTO } from '../../fanbases/dto/delete-fanbase.dto';
import { ResolveReportDTO } from '../../reports/dto/resolve-report.dto';
import { AdminGuard } from '../guards/admin.guard'; // Updated path

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ===== USER MANAGEMENT =====
  @Get('users')
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string
  ) {
    try {
      return await this.adminService.getAllUsers(page, limit, role);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch users: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    try {
      return await this.adminService.getUserById(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch user: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @Body() banData: BanUserDto) {
    try {
      return await this.adminService.banUser(id, banData);
    } catch (error) {
      throw new HttpException(
        `Failed to ban user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('users/:id/unban')
  async unbanUser(@Param('id') id: string) {
    try {
      return await this.adminService.unbanUser(id);
    } catch (error) {
      throw new HttpException(
        `Failed to unban user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('users/:id/promote-moderator')
  async promoteToModerator(@Param('id') id: string) {
    try {
      return await this.adminService.promoteToModerator(id);
    } catch (error) {
      throw new HttpException(
        `Failed to promote user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('users/:id/demote-moderator')
  async demoteFromModerator(@Param('id') id: string) {
    try {
      return await this.adminService.demoteFromModerator(id);
    } catch (error) {
      throw new HttpException(
        `Failed to demote user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== CONTENT MODERATION =====
  @Get('posts')
  async getAllPosts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('reported') reported?: boolean
  ) {
    try {
      return await this.adminService.getAllPosts(page, limit, reported);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @Body() deleteData: DeletePostDTO) {
    try {
      return await this.adminService.deletePost(id, deleteData);
    } catch (error) {
      throw new HttpException(
        `Failed to delete post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('posts/:id/restore')
  async restorePost(@Param('id') id: string) {
    try {
      return await this.adminService.restorePost(id);
    } catch (error) {
      throw new HttpException(
        `Failed to restore post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== REPORT MANAGEMENT =====
  @Get('reports')
  async getReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    try {
      return await this.adminService.getReports(page, limit, status, category);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reports/:id/resolve')
  async resolveReport(@Param('id') id: string, @Body() resolveData: ResolveReportDTO) {
    try {
      return await this.adminService.resolveReport(id, resolveData);
    } catch (error) {
      throw new HttpException(
        `Failed to resolve report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reports/:id/dismiss')
  async dismissReport(@Param('id') id: string, @Body() dismissData: { reason: string; reviewedBy: string }) {
    try {
      return await this.adminService.dismissReport(id, dismissData.reviewedBy, dismissData.reason);
    } catch (error) {
      throw new HttpException(
        `Failed to dismiss report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== FANBASE MANAGEMENT =====
  @Get('fanbases')
  async getAllFanbases(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string
  ) {
    try {
      return await this.adminService.getAllFanbases(page, limit, status);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch fanbases: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('fanbases/:id')
  async deleteFanbase(@Param('id') id: string, @Body() deleteData: DeleteFanbaseDTO) {
    try {
      return await this.adminService.deleteFanbase(id, deleteData);
    } catch (error) {
      throw new HttpException(
        `Failed to delete fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fanbases/:id/toggle-status')
  async toggleFanbaseStatus(@Param('id') id: string, @Body() statusData: { isActive: boolean }) {
    try {
      return await this.adminService.toggleFanbaseStatus(id, statusData.isActive);
    } catch (error) {
      throw new HttpException(
        `Failed to toggle fanbase status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== DASHBOARD & METRICS =====
  @Get('dashboard')
  async getDashboardData() {
    try {
      return await this.adminService.getDashboardData();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch dashboard data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics/users')
  async getUserMetrics() {
    try {
      return await this.adminService.getUserMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch user metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics/content')
  async getContentMetrics() {
    try {
      return await this.adminService.getContentMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch content metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics/reports')
  async getReportMetrics() {
    try {
      return await this.adminService.getReportMetrics();
    } catch (error) {
      throw new HttpException(
        `Failed to fetch report metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics/growth')
  async getGrowthMetrics(@Query('period') period: string = '7d') {
    try {
      return await this.adminService.getGrowthMetrics(period);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch growth metrics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}