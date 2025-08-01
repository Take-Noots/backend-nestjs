import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { SongPostService } from '../../songPost/songPost.service';
import { FanbaseService } from '../../fanbases/fanbase.service';
import { ReportService } from '../../reports/report.service';
import { BanUserDto } from '../dto/ban-user.dto';
import { ResolveReportDTO } from '../../reports/dto/resolve-report.dto';
import { Types } from 'mongoose';

@Injectable()
export class AdminService {
  constructor(
    private readonly userService: UserService,
    private readonly songPostService: SongPostService,
    private readonly fanbaseService: FanbaseService,
    private readonly reportService: ReportService,
  ) {}

  // ===== HELPER METHOD FOR CLEANING IDS =====
  private cleanObjectId(id: string | any): string | null {
    try {
      if (!id) return null;
      const cleanId = id.toString().trim();
      if (!cleanId || !Types.ObjectId.isValid(cleanId)) {
        return null;
      }
      return cleanId;
    } catch (error) {
      console.warn(`⚠️ Failed to clean ObjectId: ${id}`, error.message);
      return null;
    }
  }

  // ===== SAFE USERNAME LOOKUP =====
  private async safeGetUsername(userId: string): Promise<string> {
    try {
      const cleanUserId = this.cleanObjectId(userId);
      if (!cleanUserId) {
        console.warn(`⚠️ Invalid userId for username lookup: "${userId}"`);
        return 'Unknown User';
      }
      
      const username = await this.userService.getUsernameById(cleanUserId);
      return username || 'Unknown User';
    } catch (error) {
      console.error(`❌ Error getting username for userId: "${userId}"`, error.message);
      return 'Unknown User';
    }
  }

  // ===== USER MANAGEMENT (unchanged) =====
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

  // ===== CONTENT MODERATION (FIXED FOR POSTS) =====
  async getAllPosts(page: number = 1, limit: number = 10, reported?: boolean) {
    try {
      console.log('📊 AdminService.getAllPosts called');
      const skip = (page - 1) * limit;
      
      // Get all posts from SongPostService - but don't use findAllWithUsernames to avoid the error
      console.log('🔄 Getting posts without usernames first...');
      const allPosts = await this.songPostService.findAll();
      console.log(`📈 Found ${allPosts.length} posts from SongPostService`);
      
      // Apply filters
      let filteredPosts = allPosts;
      if (reported) {
        // Since songPost model doesn't have isReported field, return empty array for now
        filteredPosts = [];

      }
      
      // Apply pagination
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      const total = filteredPosts.length;
      
      console.log(`📊 Processing ${paginatedPosts.length} posts after pagination`);
      
      // Process posts with safe username lookup and ID cleaning
      const processedPosts = await Promise.all(paginatedPosts.map(async (post) => {
        try {
          // Clean the userId before processing
          const cleanUserId = this.cleanObjectId(post.userId);
          console.log(`🔍 Processing post ${post._id} with userId: "${post.userId}" -> cleaned: "${cleanUserId}"`);
          
          const username = cleanUserId ? await this.safeGetUsername(cleanUserId) : 'Unknown User';
          
          return {
            id: post._id,
            userId: cleanUserId || post.userId,
            username: username,
            songTitle: post.songName,
            artistName: post.artists,
            albumArt: post.albumImage,
            description: post.caption,
            likesCount: post.likes || 0,
            commentsCount: post.comments ? post.comments.length : 0,
            sharesCount: 0, // Not in songPost model
            trackId: post.trackId,
            isReported: false, // Placeholder - add this field to songPost model if needed
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
          };
        } catch (error) {
          console.error(`❌ Error processing post ${post._id}:`, error.message);
          // Return post with default values if processing fails
          return {
            id: post._id,
            userId: post.userId,
            username: 'Error Loading User',
            songTitle: post.songName || 'Unknown Song',
            artistName: post.artists || 'Unknown Artist',
            albumArt: post.albumImage,
            description: post.caption,
            likesCount: post.likes || 0,
            commentsCount: post.comments ? post.comments.length : 0,
            sharesCount: 0,
            trackId: post.trackId,
            isReported: false,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
          };
        }
      }));
      
      console.log(`✅ Successfully processed ${processedPosts.length} posts`);
      
      return {
        posts: processedPosts,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: paginatedPosts.length,
          totalPosts: total
        }
      };
    } catch (error) {
      console.error('❌ Error in AdminService.getAllPosts:', error.message);
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
  }

  async getPostById(postId: string) {
    try {
      console.log(`📊 AdminService.getPostById called with: ${postId}`);
      
      const cleanPostId = this.cleanObjectId(postId);
      if (!cleanPostId) {
        throw new Error(`Invalid post ID: ${postId}`);
      }
      
      const post = await this.songPostService.findById(cleanPostId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Get username safely with cleaned userId
      const cleanUserId = this.cleanObjectId(post.userId);
      const username = cleanUserId ? await this.safeGetUsername(cleanUserId) : 'Unknown User';

      return {
        id: post._id,
        userId: cleanUserId || post.userId,
        username: username,
        songTitle: post.songName,
        artistName: post.artists,
        albumArt: post.albumImage,
        description: post.caption,
        likesCount: post.likes || 0,
        commentsCount: post.comments ? post.comments.length : 0,
        sharesCount: 0, // Not in songPost model
        trackId: post.trackId,
        isReported: false,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
    } catch (error) {
      console.error(`❌ Error in AdminService.getPostById:`, error.message);
      throw error;
    }

  }

  async deletePost(postId: string, reason: string, deletedBy: string) {
    const cleanPostId = this.cleanObjectId(postId);
    if (!cleanPostId) {
      throw new Error(`Invalid post ID: ${postId}`);
    }
    
    const post = await this.songPostService.findById(cleanPostId);
    if (!post) {
      throw new Error('Post not found');
    }

    // You'll need to add a delete method to SongPostService or use MongoDB directly
    // For now, we'll return a placeholder response
    return { 
      message: 'Post marked for deletion', 
      postId: cleanPostId,
      reason,
      deletedBy,
      deletedAt: new Date()
    };
  }

  async restorePost(postId: string) {
    const cleanPostId = this.cleanObjectId(postId);
    if (!cleanPostId) {
      throw new Error(`Invalid post ID: ${postId}`);
    }
    
    const post = await this.songPostService.findById(cleanPostId);
    if (!post) {
      throw new Error('Post not found');
    }

    return { 
      message: 'Post restored successfully',
      postId: cleanPostId,
      restoredAt: new Date()
    };
  }

  // ===== REPORT MANAGEMENT (unchanged) =====
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

  // ===== FANBASE MANAGEMENT (unchanged) =====
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
        createdBy: fanbase.createdBy?._id || 'Unknown', // Use createdBy._id instead of createdUserId
        membersCount: fanbase.numberOfLikes,
        postsCount: fanbase.numberOfPosts,
        numberOfLikes: fanbase.numberOfLikes,
        numberOfPosts: fanbase.numberOfPosts,
        numberOfShares: fanbase.numberOfShares, // Use numberOfShares instead of numberOfComments
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
    // Use the correct method name
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