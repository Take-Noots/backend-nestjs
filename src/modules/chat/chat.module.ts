// src/modules/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';

// Regular Chat
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Chat, ChatSchema } from './chat.model';

// Group Chat
import { GroupChatService } from './group-chat.service';
import { GroupChatController } from './group-chat.controller';
import { GroupChat, GroupChatSchema } from './group-chat.model';

// User model for population
import { User, UserSchema } from '../user/user.model';

// Notification module for real-time notifications
import { NotificationModule } from '../notification/notification.module';

// Cloudinary service for image uploads
import { CloudinaryService } from '../../common/services/cloudinary.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: GroupChat.name, schema: GroupChatSchema },
      { name: User.name, schema: UserSchema }
    ]),
    HttpModule, // Add HttpModule for notification webhook calls
    NotificationModule, // Import notification module to access NotificationGateway
  ],
  controllers: [
    ChatController,
    GroupChatController
  ],
  providers: [
    ChatService,
    GroupChatService,
    CloudinaryService
  ],
  exports: [
    ChatService,
    GroupChatService
  ],
})
export class ChatModule {}