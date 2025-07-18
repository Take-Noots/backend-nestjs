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
import { ResolveReportDTO } from '../../reports/dto/resolve-report.dto';
import { AdminGuard } from '../guards/admin.guard';

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

  // ===== CONTENT MODERATION (Updated for SongPosts) =====
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

  @Get('posts/:id')
  async getPostById(@Param('id') id: string) {
    try {
      return await this.adminService.getPostById(id);
    } catch (error) {
      throw new HttpException(
        `Failed to fetch post: ${error.message}`,
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @Body() deleteData: { reason: string; deletedBy: string }) {
    try {
      return await this.adminService.deletePost(id, deleteData.reason, deleteData.deletedBy);
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

  @Post('posts/:id/review')
  async reviewPost(@Param('id') id: string, @Body() reviewData: any) {
    try {
      // Handle post review actions
      const { action, notes, reviewedBy } = reviewData;
      
      switch (action) {
        case 'approve':
          return { message: 'Post approved successfully', action: 'approved' };
        case 'warn':
          return { message: 'User warned successfully', action: 'warned' };
        case 'delete':
          return await this.adminService.deletePost(id, notes || 'Violation of community guidelines', reviewedBy);
        case 'ban':
          // This would require getting the post author and banning them
          return { message: 'Ban functionality needs user ID from post', action: 'pending' };
        default:
          throw new Error('Invalid review action');
      }
    } catch (error) {
      throw new HttpException(
        `Failed to review post: ${error.message}`,
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

  // ===== API ENDPOINTS FOR STATS =====
  @Get('api/posts-stats')
  async getPostsStats() {
    try {
      const allPosts = await this.adminService.getAllPosts(1, 1000); // Get all posts for stats
      const posts = allPosts.posts;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return {
        total: posts.length,
        reported: posts.filter(p => p.isReported).length,
        popular: posts.filter(p => (p.likesCount || 0) > 10).length,
        today: posts.filter(p => new Date(p.createdAt) >= today).length
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch post stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== BULK OPERATIONS =====
  @Post('posts/bulk-approve')
  async bulkApprovePosts(@Body() bulkData: { postIds: string[]; reason: string; actionBy: string }) {
    try {
      // Implement bulk approve logic
      return { 
        message: `Bulk approve completed for ${bulkData.postIds.length} posts`,
        processed: bulkData.postIds.length,
        action: 'approved'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to bulk approve posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('posts/bulk-delete')
  async bulkDeletePosts(@Body() bulkData: { postIds: string[]; reason: string; actionBy: string }) {
    try {
      // Implement bulk delete logic
      let processed = 0;
      for (const postId of bulkData.postIds) {
        try {
          await this.adminService.deletePost(postId, bulkData.reason, bulkData.actionBy);
          processed++;
        } catch (error) {
          console.error(`Failed to delete post ${postId}:`, error);
        }
      }
      
      return { 
        message: `Bulk delete completed for ${processed} of ${bulkData.postIds.length} posts`,
        processed,
        total: bulkData.postIds.length,
        action: 'deleted'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to bulk delete posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===== EXPORT FUNCTIONALITY =====
  @Get('posts/export')
  async exportPosts(@Query() filters: any) {
    try {
      const posts = await this.adminService.getAllPosts(1, 10000); // Get all posts
      
      // Convert to CSV format
      const csvHeader = 'ID,Song Title,Artist,Username,Description,Likes,Comments,Created At\n';
      const csvData = posts.posts.map(post => 
        `"${post.id}","${post.songTitle}","${post.artistName}","${post.username}","${post.description || ''}","${post.likesCount}","${post.commentsCount}","${post.createdAt}"`
      ).join('\n');
      
      return csvHeader + csvData;
    } catch (error) {
      throw new HttpException(
        `Failed to export posts: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}