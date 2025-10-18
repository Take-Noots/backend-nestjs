import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { AuthModule } from './modules/auth/auth.module';
import { DesSongPostModule } from './modules/desSongPost/desSongPost.module';
import { ThoughtsModule } from './modules/thoughts/thoughts.module';

// New from Merge Conflict
import { SongPostModule } from './modules/songPost/songPost.module';
import { SearchModule } from './modules/search/search.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RecentlyLikedUserModule } from './modules/interaction/interaction.module';

// Imports before Merge COnflict
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/posts/posts.module';
import { FanbaseModule } from './modules/fanbases/fanbase.module';
import { ReportModule } from './modules/reports/reports.module';
import { RequestModule } from './modules/request/request.module';
import { ChatModule } from './modules/chat/chat.module';
import { FanbasePostModule } from './modules/fanbasePost/fanbasePost.module';
import { PostReportModule } from './modules/post_report/post_report.module';
import { AdvertisementModule } from './modules/advertisement/advertisement.module';

// Add notification module import
import { NotificationModule } from './modules/notification/notification.module';

import 'dotenv/config';

const dbUrl: string = process.env.DB_CONN_STRING as string;

@Module({
  imports: [
    MongooseModule.forRoot(dbUrl),
    SpotifyModule,
    AuthModule,
    SongPostModule,
    DesSongPostModule,
    ThoughtsModule,
    SearchModule,
    ProfileModule,
    UserModule,
    PostModule,
    FanbaseModule,
    ReportModule,
    AdminModule,
    RequestModule,
    ChatModule,
    RecentlyLikedUserModule,
    FanbasePostModule,
    PostReportModule,
    AdvertisementModule,
    NotificationModule // Add notification module here
  ]
})
export class AppModule {}