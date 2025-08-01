// src/modules/fanbases/fanbase.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FanbaseService } from './fanbase.service';
import { FanbaseController } from './fanbase.controller';
import { Fanbase, FanbaseSchema } from './fanbase.model';
import { User, UserSchema } from '../user/user.model'; // Import User model

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fanbase.name, schema: FanbaseSchema },
      { name: User.name, schema: UserSchema } // Add User model to the module
    ])
  ],
  controllers: [FanbaseController], 
  providers: [FanbaseService],
  exports: [FanbaseService],
})
export class FanbaseModule {}