// src/modules/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Chat, ChatSchema } from './chat.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema }
    ])
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService], // Export service if other modules need it
})
export class ChatModule {}