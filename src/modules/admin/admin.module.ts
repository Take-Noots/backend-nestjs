// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
// ONLY AdminDashboardController - remove others to avoid conflicts
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminService } from './services/admin.service';
import { AdminGuard } from './guards/admin.guard';
import { UserModule } from '../user/user.module';
import { PostModule } from '../posts/posts.module';
import { FanbaseModule } from '../fanbases/fanbase.module';
import { ReportModule } from '../reports/reports.module';
import { PostReportModule } from '../post_report/post_report.module';
import { AuthModule } from '../auth/auth.module';
import { SongPostModule } from '../songPost/songPost.module';
import { DesSongPostModule } from '../desSongPost/desSongPost.module';
import { FanbasePostModule } from '../fanbasePost/fanbasePost.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    SongPostModule,
    DesSongPostModule,
    FanbaseModule,
    FanbasePostModule,
    ReportModule,
    PostReportModule,
    AuthModule, // This provides AuthService for login
    NotificationModule,
  ],
  controllers: [
    // REMOVE AdminController to avoid route conflicts
    // REMOVE AdminAuthController to avoid duplicate login routes
    AdminDashboardController // This handles EVERYTHING - web pages, login, AND API
  ],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}