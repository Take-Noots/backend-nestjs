import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminStaticController } from './controllers/admin-static.controller';
import { AdminService } from './services/admin.service';
import { AdminGuard } from './guards/admin.guard';
import { UserModule } from '../user/user.module';
import { PostModule } from '../posts/posts.module';
import { FanbaseModule } from '../fanbases/fanbase.module';
import { ReportModule } from '../reports/reports.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    UserModule,
    PostModule,
    FanbaseModule,
    ReportModule,
    AuthModule
  ],
  controllers: [AdminController, AdminAuthController, AdminStaticController],
  providers: [AdminService, AdminGuard],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}