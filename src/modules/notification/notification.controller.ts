// src/modules/notification/notification.controller.ts
import { Controller, Get, Post, Delete, Param, Query, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtUser, JwtUserData } from '../../common/decorators/jwt-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // New authenticated endpoint that gets current user's notifications using JWT
  @Get('my-notifications')
  @UseGuards(JwtAuthGuard)
  async getMyNotifications(
    @JwtUser() user: JwtUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      console.log('🔍 getMyNotifications called with user:', user);
      console.log('🔍 JWT user ID:', user.userId);

      const pageNumber = page ? parseInt(page) : 1;
      const limitNumber = limit ? parseInt(limit) : 20;

      const result = await this.notificationService.getUserNotifications(user.userId, pageNumber, limitNumber);
      console.log('🔍 NotificationService result:', result);

      return result;
    } catch (error) {
      console.error('❌ Error in getMyNotifications:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch notifications'
      };
    }
  }

  // Keep the old endpoint for backward compatibility
  @Get(':userId')
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const pageNumber = page ? parseInt(page) : 1;
      const limitNumber = limit ? parseInt(limit) : 20;

      const result = await this.notificationService.getUserNotifications(userId, pageNumber, limitNumber);
      return result;
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch notifications'
      };
    }
  }

  // New authenticated endpoint for unread count
  @Get('my-notifications/unread-count')
  @UseGuards(JwtAuthGuard)
  async getMyUnreadCount(@JwtUser() user: JwtUserData) {
    try {
      return await this.notificationService.getUnreadCount(user.userId);
    } catch (error) {
      console.error('Error in getMyUnreadCount:', error);
      throw new HttpException(
        `Failed to get unread count: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':userId/unread-count')
  async getUnreadCount(@Param('userId') userId: string) {
    try {
      return await this.notificationService.getUnreadCount(userId);
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      throw new HttpException(
        `Failed to get unread count: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':notificationId/read')
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @Body('userId') userId: string
  ) {
    try {
      return await this.notificationService.markAsRead(notificationId, userId);
    } catch (error) {
      console.error('Error in markAsRead:', error);
      if (error.status === HttpStatus.NOT_FOUND || error.status === HttpStatus.BAD_REQUEST) {
        throw error;
      }
      throw new HttpException(
        `Failed to mark notification as read: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // New authenticated endpoint for mark as read
  @Post('mark-as-read/:notificationId')
  @UseGuards(JwtAuthGuard)
  async markMyNotificationAsRead(
    @Param('notificationId') notificationId: string,
    @JwtUser() user: JwtUserData
  ) {
    try {
      return await this.notificationService.markAsRead(notificationId, user.userId);
    } catch (error) {
      console.error('Error in markMyNotificationAsRead:', error);
      if (error.status === HttpStatus.NOT_FOUND || error.status === HttpStatus.BAD_REQUEST) {
        throw error;
      }
      throw new HttpException(
        `Failed to mark notification as read: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // New authenticated endpoint for mark all as read
  @Post('mark-all-read')
  @UseGuards(JwtAuthGuard)
  async markAllMyNotificationsAsRead(@JwtUser() user: JwtUserData) {
    try {
      return await this.notificationService.markAllAsRead(user.userId);
    } catch (error) {
      console.error('Error in markAllMyNotificationsAsRead:', error);
      throw new HttpException(
        `Failed to mark all notifications as read: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':userId/mark-all-read')
  async markAllAsRead(@Param('userId') userId: string) {
    try {
      return await this.notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw new HttpException(
        `Failed to mark all notifications as read: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':notificationId')
  async deleteNotification(
    @Param('notificationId') notificationId: string,
    @Body('userId') userId: string
  ) {
    try {
      return await this.notificationService.deleteNotification(notificationId, userId);
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      if (error.status === HttpStatus.NOT_FOUND || error.status === HttpStatus.BAD_REQUEST) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Webhook endpoints for creating notifications (to be called by other services)
  @Post('webhook/message')
  async createMessageNotification(@Body() body: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    chatId: string;
    messageText: string;
  }) {
    try {
      return await this.notificationService.createMessageNotification(
        body.recipientId,
        body.senderId,
        body.senderUsername,
        body.chatId,
        body.messageText
      );
    } catch (error) {
      console.error('Error creating message notification:', error);
      throw new HttpException(
        `Failed to create message notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhook/group-message')
  async createGroupMessageNotification(@Body() body: {
    memberIds: string[];
    senderId: string;
    senderUsername: string;
    groupChatId: string;
    groupName: string;
    messageText: string;
  }) {
    try {
      return await this.notificationService.createGroupMessageNotification(
        body.memberIds,
        body.senderId,
        body.senderUsername,
        body.groupChatId,
        body.groupName,
        body.messageText
      );
    } catch (error) {
      console.error('Error creating group message notification:', error);
      throw new HttpException(
        `Failed to create group message notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhook/post-like')
  async createPostLikeNotification(@Body() body: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    postId: string;
    songName: string;
    artistName: string;
  }) {
    try {
      return await this.notificationService.createPostLikeNotification(
        body.recipientId,
        body.senderId,
        body.senderUsername,
        body.postId,
        body.songName,
        body.artistName
      );
    } catch (error) {
      console.error('Error creating post like notification:', error);
      throw new HttpException(
        `Failed to create post like notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhook/post-comment')
  async createPostCommentNotification(@Body() body: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    postId: string;
    songName: string;
    artistName: string;
    commentText: string;
  }) {
    try {
      return await this.notificationService.createPostCommentNotification(
        body.recipientId,
        body.senderId,
        body.senderUsername,
        body.postId,
        body.songName,
        body.artistName,
        body.commentText
      );
    } catch (error) {
      console.error('Error creating post comment notification:', error);
      throw new HttpException(
        `Failed to create post comment notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhook/fanbase-post-like')
  async createFanbasePostLikeNotification(@Body() body: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    fanbasePostId: string;
    fanbaseId: string;
    fanbaseName: string;
    postTopic: string;
  }) {
    try {
      return await this.notificationService.createFanbasePostLikeNotification(
        body.recipientId,
        body.senderId,
        body.senderUsername,
        body.fanbasePostId,
        body.fanbaseId,
        body.fanbaseName,
        body.postTopic
      );
    } catch (error) {
      console.error('Error creating fanbase post like notification:', error);
      throw new HttpException(
        `Failed to create fanbase post like notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('webhook/fanbase-post-comment')
  async createFanbasePostCommentNotification(@Body() body: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    fanbasePostId: string;
    fanbaseId: string;
    fanbaseName: string;
    postTopic: string;
    commentText: string;
  }) {
    try {
      return await this.notificationService.createFanbasePostCommentNotification(
        body.recipientId,
        body.senderId,
        body.senderUsername,
        body.fanbasePostId,
        body.fanbaseId,
        body.fanbaseName,
        body.postTopic,
        body.commentText
      );
    } catch (error) {
      console.error('Error creating fanbase post comment notification:', error);
      throw new HttpException(
        `Failed to create fanbase post comment notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}