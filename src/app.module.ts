import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/posts/posts.module';
import { FanbaseModule } from './modules/fanbases/fanbase.module';
import { ReportModule } from './modules/reports/reports.module';
import 'dotenv/config';

const dbUrl: string = process.env.DB_CONN_STRING as string;

@Module({
  imports: [
    MongooseModule.forRoot(dbUrl),
    SpotifyModule, 
    AuthModule,
    UserModule,
    PostModule,
    FanbaseModule,
    ReportModule,
    AdminModule
  ]
})
export class AppModule {}