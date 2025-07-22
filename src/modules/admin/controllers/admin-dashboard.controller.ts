// src/modules/admin/controllers/admin-dashboard.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
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

@Controller('admin')
export class AdminDashboardController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly fanbaseService: FanbaseService,
    private readonly songPostService: SongPostService
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
    @Query('search') search?: string
  ) {
    try {
      const usersData = await this.adminService.getAllUsers(page, 20, role);
      return {
        title: 'User Management',
        user: req['user'],
        users: usersData.users,
        pagination: usersData.pagination,
        currentRole: role,
        searchQuery: search
      };
    } catch (error) {
      return {
        title: 'User Management',
        user: req['user'],
        error: 'Failed to load users',
        users: [],
        pagination: null
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
    @Query('reported') reported?: boolean
  ) {
    try {
      console.log('📊 Loading posts page...');
      const postsData = await this.adminService.getAllPosts(page, 20, reported);
      console.log('📈 Posts found:', postsData.posts.length);
      
      return {
        title: 'Content Management',
        user: req['user'],
        posts: postsData.posts,
        pagination: postsData.pagination,
        showReported: reported
      };
    } catch (error) {
      console.error('❌ Failed to load posts:', error);
      return {
        title: 'Content Management',
        user: req['user'],
        error: 'Failed to load posts: ' + error.message,
        posts: [],
        pagination: null
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

  // User Detail Page
  @Get('users/:id')
  @UseGuards(AdminGuard)
  @Render('admin/user-detail')
  async userDetailPage(@Req() req: Request, @Param('id') userId: string) {
    try {
      const user = await this.adminService.getUserById(userId);
      return {
        title: 'User Details',
        user: req['user'],
        targetUser: user
      };
    } catch (error) {
      return {
        title: 'User Details',
        user: req['user'],
        error: 'User not found',
        targetUser: null
      };
    }
  }

  // ==================== API ROUTES FOR ADMIN OPERATIONS ====================
  
  // User Management API
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
      // Use FanbaseService directly to create fanbase
      return await this.fanbaseService.create(fanbaseData);
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
    @Query('role') role?: string
  ) {
    return await this.adminService.getAllUsers(page, limit, role);
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
  }}