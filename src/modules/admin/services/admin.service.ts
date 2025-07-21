import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { SongPostService } from '../../songPost/songPost.service'; // Updated import
import { FanbaseService } from '../../fanbases/fanbase.service';
import { ReportService } from '../../reports/report.service';
import { BanUserDto } from '../dto/ban-user.dto';
import { ResolveReportDTO } from '../../reports/dto/resolve-report.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly songPostService: SongPostService, // Updated to use SongPostService
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

  // ===== CONTENT MODERATION (Updated for SongPosts) =====
  async getAllPosts(page: number = 1, limit: number = 10, reported?: boolean) {
    const skip = (page - 1) * limit;
    
    // Get all posts with usernames from SongPostService
    const allPostsWithUsernames = await this.songPostService.findAllWithUsernames();
    
    // Apply filters
    let filteredPosts = allPostsWithUsernames;
    if (reported) {
      // For now, we'll assume all posts are not reported since songPost model doesn't have isReported field
      // You may need to add this field to your songPost model if you want reporting functionality
      filteredPosts = [];
    }
    
    // Apply pagination
    const paginatedPosts = filteredPosts.slice(skip, skip + limit);
    const total = filteredPosts.length;
    
    return {
      posts: paginatedPosts.map(post => ({
        id: post._id,
        userId: post.userId,
        username: post.username,
        songTitle: post.songName, // Map songName to songTitle for admin interface
        artistName: post.artists, // Map artists to artistName
        albumArt: post.albumImage, // Map albumImage to albumArt
        description: post.caption, // Map caption to description
        likesCount: post.likes,
        commentsCount: post.comments ? post.comments.length : 0,
        isReported: false, // Placeholder - add this field to songPost model if needed
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: paginatedPosts.length,
        totalPosts: total
      }
    };
  }

  async getPostById(postId: string) {
    const post = await this.songPostService.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Get username separately since it's not in the post document
    const username = await this.userService.getUsernameById(post.userId);

    return {
      id: post._id,
      userId: post.userId,
      username: username || '',
      songTitle: post.songName,
      artistName: post.artists,
      albumArt: post.albumImage,
      description: post.caption,
      likesCount: post.likes,
      commentsCount: post.comments ? post.comments.length : 0,
      isReported: false, // Placeholder
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  }

  async deletePost(postId: string, reason: string, deletedBy: string) {
    // Since songPost service doesn't have delete functionality, 
    // we'll need to implement this or work with what's available
    const post = await this.songPostService.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // For now, return success - you may need to implement actual deletion in songPostService
    return { message: 'Post deletion functionality needs to be implemented in SongPostService' };
  }

  async restorePost(postId: string) {
    const post = await this.songPostService.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // For now, return success - you may need to implement restoration in songPostService
    return { message: 'Post restoration functionality needs to be implemented in SongPostService' };
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
    
    const filter = {};
    
    const fanbases = await this.fanbaseService.findAllWithPagination(filter, skip, limit);
    const total = await this.fanbaseService.countFanbases(filter);
    
    return {
      fanbases: fanbases.map(fanbase => ({
        id: fanbase._id,
        name: fanbase.fanbaseName,
        description: fanbase.topic,
        createdBy: fanbase.createdUserId,
        membersCount: fanbase.numberOfLikes,
        postsCount: fanbase.numberOfPosts,
        numberOfLikes: fanbase.numberOfLikes,
        numberOfPosts: fanbase.numberOfPosts,
        numberOfComments: fanbase.numberOfComments,
        isActive: true,
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

  // ===== DASHBOARD & COMPREHENSIVE METRICS =====
  async getDashboardData() {
    const userMetrics = await this.getUserMetrics();
    const contentMetrics = await this.getContentMetrics();
    const reportMetrics = await this.getReportMetrics();
    
    // Get high priority items
    const highPriorityReports = await this.reportService.getHighPriorityReports(5);
    const topPosts = await this.getTopPosts(5);
    const topFanbases = await this.fanbaseService.getTopFanbases(5);

    return {
      summary: {
        users: userMetrics,
        content: contentMetrics,
        reports: reportMetrics
      },
      alerts: {
        highPriorityReports: highPriorityReports.length,
        pendingReports: reportMetrics.byStatus?.pending || 0,
        bannedUsers: userMetrics.banned
      },
      trending: {
        posts: topPosts.map(post => ({
          id: post._id,
          songTitle: post.songName,
          artistName: post.artists,
          likesCount: post.likes
        })),
        fanbases: topFanbases.map(fanbase => ({
          id: fanbase._id,
          name: fanbase.fanbaseName,
          membersCount: fanbase.numberOfLikes
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
      activeToday: 0
    };
  }

  async getContentMetrics() {
    // Get all posts and count them
    const allPosts = await this.songPostService.findAll();
    const totalPosts = allPosts.length;
    
    const totalFanbases = await this.fanbaseService.countFanbases({});
    
    // Count today's posts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = allPosts.filter(post => new Date(post.createdAt) >= today).length;
    
    const activeFanbases = totalFanbases;

    return {
      totalPosts,
      totalFanbases,
      activeFanbases,
      postsToday
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
    const postGrowth = await this.getPostGrowthData(days);
    const fanbaseGrowth = [];
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

  async getPostGrowthData(days: number): Promise<any[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    const allPosts = await this.songPostService.findAll();
    const recentPosts = allPosts.filter(post => new Date(post.createdAt) >= dateFrom);
    
    // Group by date
    const growthData: { [key: string]: number } = {};
    recentPosts.forEach(post => {
      const date = new Date(post.createdAt).toISOString().split('T')[0];
      growthData[date] = (growthData[date] || 0) + 1;
    });
    
    return Object.entries(growthData).map(([date, count]) => ({
      _id: date,
      count
    })).sort((a, b) => a._id.localeCompare(b._id));
  }

  async getTopPosts(limit: number = 10) {
    const allPosts = await this.songPostService.findAll();
    return allPosts
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, limit);
  }

  private calculateDailyAverage(growthData: any[]): number {
    if (!growthData.length) return 0;
    const total = growthData.reduce((sum, item) => sum + item.count, 0);
    return Math.round(total / growthData.length);
  }
}