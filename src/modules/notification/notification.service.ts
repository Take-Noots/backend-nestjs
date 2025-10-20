// src/modules/notification/notification.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './notification.model';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>
  ) {}

  // Get all notifications for a user
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    console.log(`🔍 getUserNotifications called with userId: ${userId}`);

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(userId);

    console.log(`🔍 Searching for notifications with recipientId: ${userObjectId}`);

    const notifications = await this.notificationModel
      .find({ recipientId: userObjectId })
      .populate('senderId', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    console.log(`🔍 Found ${notifications.length} notifications for user ${userId}`);

    // Debug: Let's also check what notifications exist in the database
    const allNotifications = await this.notificationModel.find({}).lean().exec();
    console.log(`🔍 Total notifications in database: ${allNotifications.length}`);
    if (allNotifications.length > 0) {
      console.log(`🔍 Sample notification recipientId types:`, allNotifications.slice(0, 3).map(n => ({
        recipientId: n.recipientId,
        recipientIdType: typeof n.recipientId,
        recipientIdString: n.recipientId?.toString()
      })));
    }

    const total = await this.notificationModel.countDocuments({ recipientId: userObjectId });
    const unreadCount = await this.notificationModel.countDocuments({
      recipientId: userObjectId,
      isRead: false
    });

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      recipientId: notification.recipientId.toString(),
      senderId: notification.senderId?.toString() || notification.senderId,
      senderUsername: notification.senderUsername,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    }));

    return {
      success: true,
      data: {
        notifications: formattedNotifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          unreadCount
        }
      }
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    if (!Types.ObjectId.isValid(notificationId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid notification ID or user ID format');
    }

    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), recipientId: new Types.ObjectId(userId) },
      { isRead: true, updatedAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      success: true,
      data: {
        id: notification._id.toString(),
        isRead: notification.isRead,
        updatedAt: notification.updatedAt
      },
      message: 'Notification marked as read'
    };
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const result = await this.notificationModel.updateMany(
      { recipientId: new Types.ObjectId(userId), isRead: false },
      { isRead: true, updatedAt: new Date() }
    );

    return {
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      },
      message: 'All notifications marked as read'
    };
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string) {
    if (!Types.ObjectId.isValid(notificationId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid notification ID or user ID format');
    }

    const notification = await this.notificationModel.findOneAndDelete({
      _id: new Types.ObjectId(notificationId),
      recipientId: new Types.ObjectId(userId)
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      success: true,
      data: {
        deletedId: notificationId
      },
      message: 'Notification deleted successfully'
    };
  }

  // Get unread count
  async getUnreadCount(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const count = await this.notificationModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      isRead: false
    });

    return {
      success: true,
      data: {
        unreadCount: count
      }
    };
  }

  // Create notification for new message
  async createMessageNotification(
    recipientId: string,
    senderId: string,
    senderUsername: string,
    chatId: string,
    messageText: string
  ) {
    // Don't send notification to sender
    if (recipientId === senderId) return;

    const truncatedMessage = messageText.length > 50 
      ? `${messageText.substring(0, 50)}...` 
      : messageText;

    const notification = new this.notificationModel({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      type: NotificationType.MESSAGE,
      title: 'New Message',
      message: `${senderUsername} sent you a message: "${truncatedMessage}"`,
      data: {
        chatId,
        messageText: truncatedMessage
      }
    });

    return await notification.save();
  }

  // Create notification for new group message
  async createGroupMessageNotification(
    memberIds: string[],
    senderId: string,
    senderUsername: string,
    groupChatId: string,
    groupName: string,
    messageText: string
  ) {
    const truncatedMessage = messageText.length > 50 
      ? `${messageText.substring(0, 50)}...` 
      : messageText;

    const notifications = memberIds
      .filter(memberId => memberId !== senderId) // Don't notify sender
      .map(memberId => ({
        recipientId: new Types.ObjectId(memberId),
        senderId: new Types.ObjectId(senderId),
        senderUsername,
        type: NotificationType.GROUP_MESSAGE,
        title: `New message in ${groupName}`,
        message: `${senderUsername}: "${truncatedMessage}"`,
        data: {
          groupChatId,
          messageText: truncatedMessage,
          groupName
        }
      }));

    if (notifications.length > 0) {
      return await this.notificationModel.insertMany(notifications);
    }
    return [];
  }

  // Create notification for post like
  async createPostLikeNotification(
    recipientId: string,
    senderId: string,
    senderUsername: string,
    postId: string,
    songName: string,
    artistName: string
  ) {
    // Don't send notification to sender
    if (recipientId === senderId) return;

    // Check if notification already exists for this post like
    const existingNotification = await this.notificationModel.findOne({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      type: NotificationType.POST_LIKE,
      'data.postId': postId
    });

    if (existingNotification) return existingNotification;

    const notification = new this.notificationModel({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      type: NotificationType.POST_LIKE,
      title: 'Post Liked',
      message: `${senderUsername} liked your post "${songName}" by ${artistName}`,
      data: {
        postId,
        songName,
        artistName
      }
    });

    return await notification.save();
  }

  // Create notification for post comment
  async createPostCommentNotification(
    recipientId: string,
    senderId: string,
    senderUsername: string,
    postId: string,
    songName: string,
    artistName: string,
    commentText: string
  ) {
    // Don't send notification to sender
    if (recipientId === senderId) return;

    const truncatedComment = commentText.length > 50 
      ? `${commentText.substring(0, 50)}...` 
      : commentText;

    const notification = new this.notificationModel({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      type: NotificationType.POST_COMMENT,
      title: 'New Comment',
      message: `${senderUsername} commented on your post "${songName}": "${truncatedComment}"`,
      data: {
        postId,
        songName,
        artistName,
        commentText: truncatedComment
      }
    });

    return await notification.save();
  }

  // Create notification for fanbase post like
  async createFanbasePostLikeNotification(
    recipientId: string,
    senderId: string,
    senderUsername: string,
    fanbasePostId: string,
    fanbaseId: string,
    fanbaseName: string,
    postTopic: string
  ) {
    // Don't send notification to sender
    if (recipientId === senderId) return;

    // Check if notification already exists
    const existingNotification = await this.notificationModel.findOne({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      type: NotificationType.FANBASE_POST_LIKE,
      'data.fanbasePostId': fanbasePostId
    });

    if (existingNotification) return existingNotification;

    const notification = new this.notificationModel({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      type: NotificationType.FANBASE_POST_LIKE,
      title: `Post Liked in ${fanbaseName}`,
      message: `${senderUsername} liked your post "${postTopic}" in ${fanbaseName}`,
      data: {
        fanbasePostId,
        fanbaseId,
        fanbaseName,
        postTopic
      }
    });

    return await notification.save();
  }

  // Create notification for fanbase post comment
  async createFanbasePostCommentNotification(
    recipientId: string,
    senderId: string,
    senderUsername: string,
    fanbasePostId: string,
    fanbaseId: string,
    fanbaseName: string,
    postTopic: string,
    commentText: string
  ) {
    // Don't send notification to sender
    if (recipientId === senderId) return;

    const truncatedComment = commentText.length > 50 
      ? `${commentText.substring(0, 50)}...` 
      : commentText;

    const notification = new this.notificationModel({
      recipientId: new Types.ObjectId(recipientId),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      type: NotificationType.FANBASE_POST_COMMENT,
      title: `New Comment in ${fanbaseName}`,
      message: `${senderUsername} commented on your post "${postTopic}": "${truncatedComment}"`,
      data: {
        fanbasePostId,
        fanbaseId,
        fanbaseName,
        postTopic,
        commentText: truncatedComment
      }
    });

    return await notification.save();
  }

  // Clean up old notifications (call this periodically)
  async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationModel.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    return { deletedCount: result.deletedCount };
  }

  async createAdminWarningNotification(
    recipientId: string,
    warningMessage: string,
    adminUsername: string = 'Admin'
  ) {
    try {
      // Create a dummy admin user ID for system notifications
      const adminId = new Types.ObjectId('000000000000000000000000');

      const newNotification = new this.notificationModel({
        recipientId: new Types.ObjectId(recipientId),
        senderId: adminId,
        senderUsername: adminUsername,
        type: NotificationType.ADMIN_WARNING,
        title: 'Warning from Administration',
        message: `⚠️ Warning: ${warningMessage}`,
        data: {
          senderUsername: adminUsername,
          warningMessage: warningMessage,
          type: 'admin_warning'
        },
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedNotification = await newNotification.save();

      console.log(`⚠️ Admin warning notification created for user ${recipientId}`);
      return savedNotification;
    } catch (error) {
      console.error('❌ Error creating admin warning notification:', error);
      throw error;
    }
  }
}