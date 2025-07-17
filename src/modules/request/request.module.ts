import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RequestController } from './request.controller';
import { RequestService } from './requesr.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Request, RequestSchema } from './request.model';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    UserModule,
    ProfileModule,
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
  ],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {
  
}
