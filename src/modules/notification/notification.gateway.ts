// src/modules/notification/notification.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private userSocketMap = new Map<string, string>(); // userId -> socketId
  private socketUserMap = new Map<string, string>(); // socketId -> userId

  constructor(private readonly notificationService: NotificationService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.logger.log(`User ${userId} disconnected`);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    this.userSocketMap.set(userId, client.id);
    this.socketUserMap.set(client.id, userId);
    client.join(`user_${userId}`);
    this.logger.log(`User ${userId} joined their notification room`);
  }

  // Method to send notifications to specific users
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('new_notification', notification);
  }

  // Method to send message notifications
  async sendMessageNotification(data: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    chatId: string;
    messageText: string;
    isGroup?: boolean;
    groupName?: string;
  }) {
    const notificationData = {
      type: data.isGroup ? 'group_message' : 'message',
      senderUsername: data.senderUsername,
      messageText: data.messageText,
      chatId: data.chatId,
      groupName: data.groupName,
      isGroup: data.isGroup,
    };

    // Send real-time notification
    this.server.to(`user_${data.recipientId}`).emit('new_message', notificationData);
    
    // Create persistent notification
    if (data.isGroup) {
      // Handle group message notification creation
      // You might need to get all member IDs here
    } else {
      await this.notificationService.createMessageNotification(
        data.recipientId,
        data.senderId,
        data.senderUsername,
        data.chatId,
        data.messageText
      );
    }
  }

  // Method to send post like notifications
  async sendPostLikeNotification(data: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    postId: string;
    songName: string;
    artistName: string;
  }) {
    const notificationData = {
      type: 'post_like',
      senderUsername: data.senderUsername,
      postId: data.postId,
      songName: data.songName,
      artistName: data.artistName,
    };

    // Send real-time notification
    this.server.to(`user_${data.recipientId}`).emit('post_liked', notificationData);
    
    // Create persistent notification
    await this.notificationService.createPostLikeNotification(
      data.recipientId,
      data.senderId,
      data.senderUsername,
      data.postId,
      data.songName,
      data.artistName
    );
  }

  // Method to send comment notifications
  async sendCommentNotification(data: {
    recipientId: string;
    senderId: string;
    senderUsername: string;
    postId: string;
    songName: string;
    artistName: string;
    commentText: string;
  }) {
    const notificationData = {
      type: 'post_comment',
      senderUsername: data.senderUsername,
      postId: data.postId,
      songName: data.songName,
      artistName: data.artistName,
      commentText: data.commentText,
    };

    // Send real-time notification
    this.server.to(`user_${data.recipientId}`).emit('post_commented', notificationData);
    
    // Create persistent notification
    await this.notificationService.createPostCommentNotification(
      data.recipientId,
      data.senderId,
      data.senderUsername,
      data.postId,
      data.songName,
      data.artistName,
      data.commentText
    );
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSocketMap.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSocketMap.has(userId);
  }
}