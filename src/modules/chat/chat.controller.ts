// src/modules/chat/chat.controller.ts
import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':userId')
  async getUserChats(@Param('userId') userId: string) {
    try {
      return await this.chatService.getUserChats(userId);
    } catch (error) {
      console.error('❌ Error in getUserChats:', error);
      throw new HttpException(
        `Failed to fetch user chats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('messages/:chatId')
  async getChatMessages(@Param('chatId') chatId: string) {
    try {
      return await this.chatService.getChatMessages(chatId);
    } catch (error) {
      console.error('❌ Error in getChatMessages:', error);
      if (error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch chat messages: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    try {
      return await this.chatService.sendMessage(sendMessageDto);
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        `Failed to send message: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createChat(@Body() createChatDto: CreateChatDto) {
    try {
      console.log('📥 Received chat creation request:', createChatDto);
      
      // Basic validation
      if (!createChatDto.senderId || !createChatDto.receiverId) {
        console.log('❌ Missing required fields');
        throw new HttpException(
          'Both senderId and receiverId are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if trying to create chat with self
      if (createChatDto.senderId === createChatDto.receiverId) {
        console.log('❌ Cannot create chat with yourself');
        throw new HttpException(
          'Cannot create chat with yourself',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.chatService.createChat(createChatDto);
      console.log('✅ Chat creation successful');
      return result;
      
    } catch (error) {
      console.error('❌ Chat creation error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack?.substring(0, 500) // Truncate stack trace
      });
      
      if (error.status === HttpStatus.BAD_REQUEST) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to create chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':chatId')
  async deleteChat(
    @Param('chatId') chatId: string,
    @Body('userId') userId: string
  ) {
    try {
      await this.chatService.deleteChat(chatId, userId);
      return { message: 'Chat deleted successfully' };
    } catch (error) {
      console.error('❌ Error in deleteChat:', error);
      if (error.status === HttpStatus.BAD_REQUEST || error.status === HttpStatus.NOT_FOUND) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}