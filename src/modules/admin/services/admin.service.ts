import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { PostService } from '../../posts/post.service';
import { FanbaseService } from '../../fanbases/fanbase.service';
import { ReportService } from '../../reports/report.service';
import { BanUserDto } from '../dto/ban-user.dto';
import { DeletePostDTO } from '../../posts/dto/delete-post.dto';
import { DeleteFanbaseDTO } from '../../fanbases/dto/delete-fanbase.dto';
import { ResolveReportDTO } from '../../reports/dto/resolve-report.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly fanbaseService: FanbaseService,
    private readonly reportService: ReportService,
  ) {}

  // ===== USER MANAGEMENT =====
  async getAllUsers(page: number = 1, limit: number = 10, role?: string) {
    const skip = (page - 1) * limit;
    
    const filter = role ? { role } : {};
    const users = await this.userService.findAllWithPagination(filter, skip, limit);
    const total = await this.userService.countUsers(filter);
    
    return {
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked || false,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      }
    };
  }

  async getUserById(id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked || false,
      banReason: user.banReason,
      bannedAt: user.bannedAt,
      banUntil: user.banUntil,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
    };
  }

  async banUser(userId: string, banData: BanUserDto) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userService.banUser(userId, {
      reason: banData.reason,
      duration: banData.duration,
      bannedBy: banData.bannedBy
    });

    return { message: 'User banned successfully' };
  }

  async unbanUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userService.unbanUser(userId);
    
    return { message: 'User unbanned successfully' };
  }

  async promoteToModerator(userId: string) {
    await this.userService.updateUserRole(userId, 'moderator');
    return { message: 'User promoted to moderator successfully' };
  }

  async demoteFromModerator(userId: string) {
    await this.userService.updateUserRole(userId, 'user');
    return { message: 'User demoted from moderator successfully' };
  }

  // ===== CONTENT MODERATION =====
  async getAllPosts(page: number = 1, limit: number = 10, reported?: boolean) {
    const skip = (page - 1) * limit;
    
    const filter = reported ? { isReported: true, isDeleted: false } : { isDeleted: false };
    const posts = await this.postService.findAllWithPagination(filter, skip, limit);
    const total = await this.postService.countPosts(filter);
    
    return {
      posts: posts.map(post => ({
        id: post._id,
        userId: post.userId,
        description: post.description,
        songTitle: post.songTitle,
        artistName: post.artistName,
        albumArt: post.albumArt,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        isReported: post.isReported,
        createdAt: post.createdAt
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: posts.length,
        totalPosts: total
      }
    };
  }

  async deletePost(postId: string, deleteData: DeletePostDTO) {
    const post = await this.postService.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await this.postService.deletePost(postId, deleteData.deletedBy, deleteData.reason);
    return { message: 'Post deleted successfully' };
  }

  async restorePost(postId: string) {
    const post = await this.postService.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    await this.postService.restorePost(postId);
    return { message: 'Post restored successfully' };
  }

  // ===== REPORT MANAGEMENT =====
  async getReports(page: number = 1, limit: number = 10, status?: string, category?: string) {
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    
    const reports = await this.reportService.findAllWithPagination(filter, skip, limit);
    const total = await this.reportService.countReports(filter);
    
    return {
      reports: reports.map(report => ({
        id: report._id,
        reportedBy: report.reportedBy,
        contentType: report.contentType,
        contentId: report.contentId,
        reason: report.reason,
        category: report.category,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: reports.length,
        totalReports: total
      }
    };
  }

  async resolveReport(reportId: string, resolveData: ResolveReportDTO) {
    const report = await this.reportService.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    await this.reportService.resolveReport(reportId, resolveData);
    return { message: 'Report resolved successfully' };
  }

  async dismissReport(reportId: string, reviewedBy: string, reason: string) {
    const report = await this.reportService.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    await this.reportService.dismissReport(reportId, reviewedBy, reason);
    return { message: 'Report dismissed successfully' };
  }

  // ===== FANBASE MANAGEMENT =====
  async getAllFanbases(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    
    let filter: { isDeleted: boolean; isActive?: boolean } = { isDeleted: false };
    if (status === 'active') filter = { ...filter, isActive: true };
    if (status === 'inactive') filter = { ...filter, isActive: false };
    
    const fanbases = await this.fanbaseService.findAllWithPagination(filter, skip, limit);
    const total = await this.fanbaseService.countFanbases(filter);
    
    return {
      fanbases: fanbases.map(fanbase => ({
        id: fanbase._id,
        name: fanbase.name,
        description: fanbase.description,
        createdBy: fanbase.createdBy,
        membersCount: fanbase.membersCount,
        postsCount: fanbase.postsCount,
        isActive: fanbase.isActive,
        createdAt: fanbase.createdAt
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: fanbases.length,
        totalFanbases: total
      }
    };
  }

  async deleteFanbase(fanbaseId: string, deleteData: DeleteFanbaseDTO) {
    const fanbase = await this.fanbaseService.findById(fanbaseId);
    if (!fanbase) {
      throw new Error('Fanbase not found');
    }

    await this.fanbaseService.deleteFanbase(fanbaseId, deleteData.deletedBy, deleteData.reason);
    return { message: 'Fanbase deleted successfully' };
  }

  async toggleFanbaseStatus(fanbaseId: string, isActive: boolean) {
    const fanbase = await this.fanbaseService.findById(fanbaseId);
    if (!fanbase) {
      throw new Error('Fanbase not found');
    }

    await this.fanbaseService.toggleFanbaseStatus(fanbaseId, isActive);
    return { message: `Fanbase ${isActive ? 'activated' : 'deactivated'} successfully` };
  }

  // ===== DASHBOARD & COMPREHENSIVE METRICS =====
  async getDashboardData() {
    const userMetrics = await this.getUserMetrics();
    const contentMetrics = await this.getContentMetrics();
    const reportMetrics = await this.getReportMetrics();
    
    // Get high priority items
    const highPriorityReports = await this.reportService.getHighPriorityReports(5);
    const topPosts = await this.postService.getTopPosts(5);
    const topFanbases = await this.fanbaseService.getTopFanbases(5);

    return {
      summary: {
        users: userMetrics,
        content: contentMetrics,
        reports: reportMetrics
      },
      alerts: {
        highPriorityReports: highPriorityReports.length,
        pendingReports: reportMetrics.byStatus.pending || 0,
        bannedUsers: userMetrics.banned
      },
      trending: {
        posts: topPosts.map(post => ({
          id: post._id,
          songTitle: post.songTitle,
          artistName: post.artistName,
          likesCount: post.likesCount
        })),
        fanbases: topFanbases.map(fanbase => ({
          id: fanbase._id,
          name: fanbase.name,
          membersCount: fanbase.membersCount
        }))
      }
    };
  }

  async getUserMetrics() {
    const totalUsers = await this.userService.countUsers({});
    const totalModerators = await this.userService.countUsers({ role: 'moderator' });
    const totalBanned = await this.userService.countUsers({ isBlocked: true });
    const recentUsers = await this.userService.countRecentUsers(7);

    return {
      total: totalUsers,
      moderators: totalModerators,
      banned: totalBanned,
      newThisWeek: recentUsers,
      activeToday: 0 // You can implement this later with activity tracking
    };
  }

  async getContentMetrics() {
    const totalPosts = await this.postService.countPosts({ isDeleted: false });
    const totalFanbases = await this.fanbaseService.countFanbases({ isDeleted: false });
    const recentPosts = await this.postService.countRecentPosts(1); // today
    const activeFanbases = await this.fanbaseService.countFanbases({ isActive: true, isDeleted: false });

    return {
      totalPosts,
      totalFanbases,
      activeFanbases,
      postsToday: recentPosts
    };
  }

  async getReportMetrics() {
    const reportStats = await this.reportService.getReportStats();
    const recentReports = await this.reportService.countRecentReports(7);
    const totalReports = await this.reportService.countReports({});

    return {
      total: totalReports,
      newThisWeek: recentReports,
      byStatus: reportStats.byStatus,
      byCategory: reportStats.byCategory
    };
  }

  async getGrowthMetrics(period: string = '7d') {
    const days = period === '30d' ? 30 : 7;
    
    const userGrowth = await this.userService.getUserGrowthData(days);
    const postGrowth = await this.postService.getPostGrowthData(days);
    const fanbaseGrowth = await this.fanbaseService.getFanbaseGrowthData(days);
    const reportGrowth = await this.reportService.getReportGrowthData(days);
    
    return {
      period,
      userGrowth,
      contentGrowth: {
        posts: postGrowth,
        fanbases: fanbaseGrowth
      },
      reportGrowth,
      engagement: {
        postsPerDay: this.calculateDailyAverage(postGrowth),
        reportsPerDay: this.calculateDailyAverage(reportGrowth)
      }
    };
  }

  private calculateDailyAverage(growthData: any[]): number {
    if (!growthData.length) return 0;
    const total = growthData.reduce((sum, item) => sum + item.count, 0);
    return Math.round(total / growthData.length);
  }
}