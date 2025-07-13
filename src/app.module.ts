import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { AuthModule } from './modules/auth/auth.module';

// New from Merge Conflict
import { SongPostModule } from './modules/songPost/songPost.module';
import { SearchModule } from './modules/search/search.module';
import { ProfileModule } from './modules/profile/profile.module';

// Imports before Merge COnflict
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
    SongPostModule,
    SearchModule,
    ProfileModule,
    UserModule,
    PostModule,
    FanbaseModule,
    ReportModule,
    AdminModule
  ]
})
export class AppModule {}