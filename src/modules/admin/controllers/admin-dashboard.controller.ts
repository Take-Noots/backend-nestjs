// src/modules/admin/controllers/admin-dashboard.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Render,
  Req,
  Res,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../../auth/auth.service';
import { FanbaseService } from '../../fanbases/fanbase.service';
import { SongPostService } from '../../songPost/songPost.service';
import { PostReportService } from '../../post_report/post_report.service';

@Controller('admin')
export class AdminDashboardController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly fanbaseService: FanbaseService,
    private readonly songPostService: SongPostService,
    private readonly postReportService: PostReportService
  ) {}

  // ==================== PUBLIC ROUTES (NO GUARD) ====================
  
  // Login Page (PUBLIC - No Guard)
  @Get('login')
  @Render('admin/login')
  async loginPage(@Req() req: Request, @Res() res: Response) {
    try {
      // Check if user is already authenticated
      const token = req.cookies?.access_token || req.cookies?.admin_refresh_token;
      
      if (token) {
        try {
          const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, secret) as any;
          
          if (decoded.sub) {
            console.log('👤 User already authenticated, redirecting to dashboard');
            return res.redirect('/admin');
          }
        } catch (error) {
          // Invalid token, clear cookies and show login
          console.log('🧹 Clearing invalid tokens');
          res.clearCookie('access_token');
          res.clearCookie('admin_refresh_token');
        }
      }
      
      return {
        title: 'Admin Login'
      };
    } catch (error) {
      console.error('❌ Login page error:', error);
      return {
        title: 'Admin Login',
        error: 'Login system error'
      };
    }
  }

  // Handle Login Form Submission (PUBLIC - No Guard)
  @Post('login')
  async handleLogin(
    @Body() loginData: { email: string; password: string },
    @Res() res: Response
  ) {
    try {
      console.log('🔐 Admin login attempt for:', loginData.email);
      
      // Validate input
      if (!loginData.email || !loginData.password) {
        return res.render('admin/login', { 
          title: 'Admin Login',
          error: 'Email and password are required'
        });
      }

      // Use AuthService to authenticate
      const [user, accessToken, refreshToken] = await this.authService.login(loginData);

      console.log('👤 User authenticated:', { id: user._id, email: user.email, role: user.role });

      // Check if user has admin/moderator privileges
      if (user.role !== 'admin' && user.role !== 'moderator') {
        console.log('❌ Access denied - insufficient privileges:', user.role);
        return res.render('admin/login', { 
          title: 'Admin Login',
          error: 'Access denied. Admin or Moderator privileges required.'
        });
      }

      // Check if user is banned
      if (user.isBlocked) {
        console.log('❌ Account blocked:', user.email);
        return res.render('admin/login', { 
          title: 'Admin Login',
          error: 'Account is blocked. Contact administrator.'
        });
      }

      console.log('✅ Admin login successful for:', user.email);
      console.log('🔑 Setting cookies with tokens');

      // Set secure cookies for admin session
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('admin_refresh_token', refreshToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log('🏠 Redirecting to dashboard...');
      // Redirect to admin dashboard
      res.redirect('/admin');
      
    } catch (error) {
      console.error('❌ Admin login failed:', error.message);
      
      // Handle specific error types
      let errorMessage = 'Invalid email or password';
      
      if (error.message.includes('User not found')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('Invalid password')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message.includes('blocked')) {
        errorMessage = 'Account is blocked';
      }
      
      res.render('admin/login', { 
        title: 'Admin Login',
        error: errorMessage
      });
    }
  }

  // Logout (PUBLIC - No Guard needed)
  @Post('logout')
  async logout(@Res() res: Response) {
    try {
      console.log('🚪 Admin logout');
      
      // Clear all admin cookies
      res.clearCookie('access_token');
      res.clearCookie('admin_refresh_token');
      
      // Redirect to login page
      res.redirect('/admin/login');
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      res.redirect('/admin/login');
    }
  }

  // ==================== PROTECTED ROUTES (WITH GUARD) ====================

  // Dashboard Home - Protected Route
  @Get()
  @UseGuards(AdminGuard)
  @Render('admin/dashboard')
  async dashboard(@Req() req: Request) {
    try {
      console.log('📊 Loading dashboard for user:', req['user']?.email);
      const dashboardData = await this.adminService.getDashboardData();
      return {
        title: 'Admin Dashboard',
        user: req['user'],
        data: dashboardData
      };
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      return {
        title: 'Admin Dashboard',
        user: req['user'],
        error: 'Failed to load dashboard data',
        data: null
      };
    }
  }

  // Users Management Page
  @Get('users')
  @UseGuards(AdminGuard)
  @Render('admin/users')
  async usersPage(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateRange') dateRange?: string
  ) {
    try {
      const usersData = await this.adminService.getAllUsers(page, 20, role, search, status, dateRange);
      return {
        title: 'User Management',
        user: req['user'],
        users: usersData.users,
        pagination: usersData.pagination,
        currentRole: role,
        searchQuery: search,
        currentStatus: status,
        currentDateRange: dateRange
      };
    } catch (error) {
      return {
        title: 'User Management',
        user: req['user'],
        error: 'Failed to load users',
        users: [],
        pagination: null,
        currentRole: role,
        searchQuery: search,
        currentStatus: status,
        currentDateRange: dateRange
      };
    }
  }

  // Posts Management Page - Fixed for SongPosts
  @Get('posts')
  @UseGuards(AdminGuard)
  @Render('admin/posts')
  async postsPage(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateRange') dateRange?: string,
    @Query('engagement') engagement?: string,
    @Query('reported') reported?: boolean
  ) {
    try {
      console.log('📊 Loading posts page...');
      const postsData = await this.adminService.getAllPosts(page, 20, {
        search,
        status,
        dateRange,
        engagement,
        reported: reported || (status === 'reported')
      });
      console.log('📈 Posts found:', postsData.posts.length);

      return {
        title: 'Content Management',
        user: req['user'],
        posts: postsData.posts,
        pagination: postsData.pagination,
        showReported: reported || (status === 'reported'),
        searchQuery: search,
        currentStatus: status,
        currentDateRange: dateRange,
        currentEngagement: engagement
      };
    } catch (error) {
      console.error('❌ Failed to load posts:', error);
      return {
        title: 'Content Management',
        user: req['user'],
        error: 'Failed to load posts: ' + error.message,
        posts: [],
        pagination: null,
        searchQuery: search,
        currentStatus: status,
        currentDateRange: dateRange,
        currentEngagement: engagement
      };
    }
  }

  // Reports Management Page
  @Get('reports')
  @UseGuards(AdminGuard)
  @Render('admin/reports')
  async reportsPage(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('status') status?: string,
    @Query('category') category?: string
  ) {
    try {
      const reportsData = await this.adminService.getReports(page, 20, status, category);
      return {
        title: 'Reports Management',
        user: req['user'],
        reports: reportsData.reports,
        pagination: reportsData.pagination,
        currentStatus: status,
        currentCategory: category
      };
    } catch (error) {
      return {
        title: 'Reports Management',
        user: req['user'],
        error: 'Failed to load reports',
        reports: [],
        pagination: null
      };
    }
  }

  // Fanbases Management Page
  @Get('fanbases')
  @UseGuards(AdminGuard)
  @Render('admin/fanbases')
  async fanbasesPage(
    @Req() req: Request,
    @Query('page') page: number = 1,
    @Query('status') status?: string
  ) {
    try {
      console.log('📊 Loading fanbases page...');
      
      // Use FanbaseService directly instead of AdminService
      const skip = (page - 1) * 20;
      const fanbases = await this.fanbaseService.findAllWithPagination({}, skip, 20);
      const total = await this.fanbaseService.countFanbases({});
      
      console.log('📈 Fanbases found:', fanbases.length);
      console.log('📊 Total fanbases:', total);
      
      return {
        title: 'Fanbases Management',
        user: req['user'],
        fanbases: fanbases, // Direct fanbase data with correct field names
        pagination: {
          current: page,
          total: Math.ceil(total / 20),
          totalFanbases: total,
          limit: 20
        },
        currentStatus: status
      };
    } catch (error) {
      console.error('❌ Failed to load fanbases:', error);
      return {
        title: 'Fanbases Management',
        user: req['user'],
        error: 'Failed to load fanbases: ' + error.message,
        fanbases: [],
        pagination: null
      };
    }
  }

  // Analytics Page
  @Get('analytics')
  @UseGuards(AdminGuard)
  @Render('admin/analytics')
  async analyticsPage(
    @Req() req: Request,
    @Query('period') period: string = '7d'
  ) {
    try {
      const userMetrics = await this.adminService.getUserMetrics();
      const contentMetrics = await this.adminService.getContentMetrics();
      const reportMetrics = await this.adminService.getReportMetrics();
      const growthMetrics = await this.adminService.getGrowthMetrics(period);

      return {
        title: 'Analytics',
        user: req['user'],
        userMetrics,
        contentMetrics,
        reportMetrics,
        growthMetrics,
        currentPeriod: period
      };
    } catch (error) {
      return {
        title: 'Analytics',
        user: req['user'],
        error: 'Failed to load analytics',
        userMetrics: null,
        contentMetrics: null,
        reportMetrics: null,
        growthMetrics: null
      };
    }
  }

  // Settings Page
  @Get('settings')
  @UseGuards(AdminGuard)
  @Render('admin/settings')
  async settingsPage(@Req() req: Request) {
    return {
      title: 'Admin Settings',
      user: req['user']
    };
  }

  // Export functionality - MUST be before users/:id to avoid route conflict
  @Get('users/export')
  @UseGuards(AdminGuard)
  async exportUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateRange') dateRange?: string,
    @Res() res?: Response
  ) {
    try {
      // Get all users with current filters (no pagination for export)
      const usersData = await this.adminService.getAllUsers(1, 10000, role, search, status, dateRange);

      // Create CSV content
      const csvHeader = 'ID,Username,Email,Role,Status,Created At,Last Active\n';
      const csvData = usersData.users.map(user => {
        const lastActiveStr = user.lastActive ? new Date(user.lastActive).toISOString() : 'Never';
        const createdAtStr = user.createdAt ? new Date(user.createdAt).toISOString() : 'Unknown';
        return `"${user.id}","${user.username || ''}","${user.email}","${user.role}","${user.isBlocked ? 'Blocked' : 'Active'}","${createdAtStr}","${lastActiveStr}"`;
      }).join('\n');

      const csvContent = csvHeader + csvData;

      if (res) {
        // Set headers for file download
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
        });

        return res.send(csvContent);
      }

      return { csv: csvContent };
    } catch (error) {
      throw new HttpException(
        `Failed to export users: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // User Detail API - Returns JSON only (used by user modal)
  @Get('users/:id')
  @UseGuards(AdminGuard)
  async getUserDetails(@Req() req: Request, @Res() res: Response, @Param('id') userId: string) {
    try {
      const user = await this.adminService.getUserById(userId);
      return res.json(user);
    } catch (error) {
      return res.status(404).json({
        error: 'User not found',
        message: error.message
      });
    }
  }

  // ==================== API ROUTES FOR ADMIN OPERATIONS ====================
  
  // User Management API
  @Post('users')
  @UseGuards(AdminGuard)
  async createUser(@Body() userData: any, @Req() req: Request) {
    try {
      const createdUser = await this.authService.register({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        role: userData.role || 'user'
      });

      return {
        message: 'User created successfully',
        user: {
          id: createdUser._id,
          email: createdUser.email,
          username: createdUser.username,
          role: createdUser.role
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('users/:id')
  @UseGuards(AdminGuard)
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    try {
      const user = await this.adminService.getUserById(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Update user data
      const updatedUser = await this.adminService.updateUser(id, updateData);

      return {
        message: 'User updated successfully',
        user: updatedUser
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('users/:id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id') id: string, @Body() deleteData: any) {
    try {
      const user = await this.adminService.getUserById(id);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Delete user
      await this.adminService.deleteUser(id, deleteData.reason, deleteData.deletedBy);

      return {
        message: 'User deleted successfully'
      };
    } catch (error) {
      throw new HttpException(
        `Failed to delete user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('users/:id/ban')
  @UseGuards(AdminGuard)
  async banUser(@Param('id') id: string, @Body() banData: any) {
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
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
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
  @UseGuards(AdminGuard)
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

  // Content Management API - Updated for SongPosts
  @Delete('posts/:id')
  @UseGuards(AdminGuard)
  async deletePost(@Param('id') id: string, @Body() deleteData: any) {
    try {
      return await this.adminService.deletePost(id, deleteData.reason, deleteData.deletedBy);
    } catch (error) {
      throw new HttpException(
        `Failed to delete post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('posts/:id')
  @UseGuards(AdminGuard)
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

  // Report Management API
  @Post('reports/:id/resolve')
  @UseGuards(AdminGuard)
  async resolveReport(@Param('id') id: string, @Body() resolveData: any) {
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
  @UseGuards(AdminGuard)
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

  // Fanbase Management API
  @Post('fanbases')
  @UseGuards(AdminGuard)
  async createFanbase(@Body() fanbaseData: any) {
    try {
      // Admin creates fanbase - use a default admin user ID or extract from request
      // You'll need to modify this based on how you want to handle admin-created fanbases
      const adminUserId = fanbaseData.createdUserId || 'admin-user-id'; // Replace with actual admin user ID
      
      // Use FanbaseService with required userId parameter
      return await this.fanbaseService.create(fanbaseData, adminUserId);
    } catch (error) {
      throw new HttpException(
        `Failed to create fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('fanbases/:id')
  @UseGuards(AdminGuard)
  async getFanbaseById(@Param('id') id: string) {
    try {
      const fanbase = await this.fanbaseService.findById(id);
      if (!fanbase) {
        throw new HttpException('Fanbase not found', HttpStatus.NOT_FOUND);
      }
      return fanbase;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch fanbase: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== API ROUTES FOR AJAX CALLS ====================
  
  @Get('api/users')
  @UseGuards(AdminGuard)
  async getUsersApi(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateRange') dateRange?: string
  ) {
    return await this.adminService.getAllUsers(page, limit, role, search, status, dateRange);
  }

  @Get('api/dashboard')
  @UseGuards(AdminGuard)
  async getDashboardApi() {
    return await this.adminService.getDashboardData();
  }

  @Get('api/analytics/:period')
  @UseGuards(AdminGuard)
  async getAnalyticsApi(@Param('period') period: string) {
    return await this.adminService.getGrowthMetrics(period);
  }

  @Get('api/reports-stats')
  @UseGuards(AdminGuard)
  async getReportsStatsApi() {
    return await this.adminService.getReportMetrics();
  }

  @Get('api/posts-stats')
  @UseGuards(AdminGuard)
  async getPostsStatsApi() {
    try {
      const allPosts = await this.songPostService.findAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return {
        total: allPosts.length,
        reported: 0, // Since songPost model doesn't have isReported field
        popular: allPosts.filter(p => (p.likes || 0) > 10).length,
        today: allPosts.filter(p => new Date(p.createdAt) >= today).length
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch post stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('api/users-stats')
  @UseGuards(AdminGuard)
  async getUsersStatsApi() {
    try {
      const userMetrics = await this.adminService.getUserMetrics();

      return {
        total: userMetrics.total,
        active: userMetrics.total - userMetrics.banned, // Active users = total - banned
        moderators: userMetrics.moderators,
        banned: userMetrics.banned
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch user stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ==================== POST REPORT MANAGEMENT ENDPOINTS ====================

  @Post('reports/:id/approve')
  @UseGuards(AdminGuard)
  async approveReport(@Param('id') reportId: string, @Body() body: { adminNotes?: string }, @Req() req: Request) {
    try {
      const report = await this.postReportService.reviewReport(
        reportId,
        { status: 'approved', adminNotes: body.adminNotes },
        req['user'].id
      );

      return {
        message: 'Report approved successfully',
        report: report
      };
    } catch (error) {
      throw new HttpException(
        `Failed to approve report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reports/:id/reject')
  @UseGuards(AdminGuard)
  async rejectReport(@Param('id') reportId: string, @Body() body: { adminNotes?: string }, @Req() req: Request) {
    try {
      const report = await this.postReportService.reviewReport(
        reportId,
        { status: 'rejected', adminNotes: body.adminNotes },
        req['user'].id
      );

      return {
        message: 'Report rejected successfully',
        report: report
      };
    } catch (error) {
      throw new HttpException(
        `Failed to reject report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('api/reports')
  @UseGuards(AdminGuard)
  async getAllReports() {
    try {
      const reports = await this.postReportService.findAllReports();
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('api/reports/pending')
  @UseGuards(AdminGuard)
  async getPendingReports() {
    try {
      const reports = await this.postReportService.getPendingReports();
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch pending reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('api/reports/post/:postId')
  @UseGuards(AdminGuard)
  async getReportsByPostId(@Param('postId') postId: string) {
    try {
      const reports = await this.postReportService.getReportsByPostId(postId);
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch post reports: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

}