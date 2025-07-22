// src/modules/chat/chat.controller.ts
import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
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
  async sendMessage(@Body() sendMessageDto: SendMessageDto) {
    try {
      return await this.chatService.sendMessage(sendMessageDto);
    } catch (error) {
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
  async createChat(@Body() createChatDto: CreateChatDto) {
    try {
      return await this.chatService.createChat(createChatDto);
    } catch (error) {
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