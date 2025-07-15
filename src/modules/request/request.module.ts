import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RequestController } from './request.controller';
import { RequestService } from './requesr.service';

@Module({
  imports: [UserModule],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {
  
}
