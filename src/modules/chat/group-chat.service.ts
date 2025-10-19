// src/modules/group-chat/group-chat.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GroupChat, GroupChatDocument, GroupMessage } from './group-chat.model';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { GroupChatType, GroupMessageType } from '../../common/interfaces/group-chat.interface';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class GroupChatService {
  constructor(
    @InjectModel(GroupChat.name) private groupChatModel: Model<GroupChatDocument>,
    private readonly notificationGateway: NotificationGateway, // Add notification gateway
  ) {}

  async createGroupChat(createGroupChatDto: CreateGroupChatDto): Promise<GroupChatType> {
    const { name, description, groupIcon, createdBy, memberIds } = createGroupChatDto;
    
    console.log('🔥 Creating group chat:', { name, createdBy, memberIds });

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(createdBy)) {
      throw new BadRequestException('Invalid createdBy format');
    }

    // Validate member IDs
    for (const memberId of memberIds) {
      if (!Types.ObjectId.isValid(memberId)) {
        throw new BadRequestException(`Invalid member ID format: ${memberId}`);
      }
    }

    // Ensure creator is included in members
    const allMembers = [...new Set([createdBy, ...memberIds])];

    if (allMembers.length < 3) { // Creator + at least 2 others
      throw new BadRequestException('Group chat must have at least 3 members');
    }

    try {
      const groupChatData = {
        name: name.trim(),
        description: description?.trim(),
        groupIcon: groupIcon?.trim(),
        members: allMembers.map(id => new Types.ObjectId(id)),
        createdBy: new Types.ObjectId(createdBy),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 Saving new group chat...');
      const newGroupChat = await this.groupChatModel.create(groupChatData);
      console.log('✅ Group chat saved with ID:', newGroupChat._id);

      // Populate members before returning
      const populatedGroupChat = await this.groupChatModel
        .findById(newGroupChat._id)
        .populate('members', 'username email lastActive createdAt')
        .populate('createdBy', 'username email')
        .exec();

      if (!populatedGroupChat) {
        throw new NotFoundException('Failed to create and populate group chat');
      }

      console.log('✅ Group chat created successfully');
      return this.toGroupChatType(populatedGroupChat);

    } catch (error) {
      console.error('❌ Error in createGroupChat:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create group chat: ${error.message}`);
    }
  }

  async getUserGroupChats(userId: string): Promise<GroupChatType[]> {
    console.log('🔍 Getting group chats for user:', userId);
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const groupChats = await this.groupChatModel
        .find({ members: userId })
        .populate('members', 'username email lastActive createdAt')
        .populate('createdBy', 'username email')
        .sort({ updatedAt: -1 })
        .exec();

      console.log('📊 Found group chats:', groupChats.length);
      return groupChats.filter(chat => chat !== null).map(chat => this.toGroupChatType(chat));
    } catch (error) {
      console.error('❌ Error in getUserGroupChats:', error);
      throw error;
    }
  }

  async getGroupChatMessages(groupChatId: string): Promise<GroupMessageType[]> {
    console.log('📨 Getting messages for group chat:', groupChatId);
    
    if (!Types.ObjectId.isValid(groupChatId)) {
      throw new BadRequestException('Invalid group chat ID format');
    }

    const groupChat = await this.groupChatModel.findById(groupChatId).exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Sort messages by timestamp
    const messages = groupChat.messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log('📨 Found messages:', messages.length);
    return messages.map(message => this.toGroupMessageType(message));
  }

  async sendGroupMessage(sendGroupMessageDto: SendGroupMessageDto): Promise<GroupMessageType> {
    const { groupChatId, senderId, senderUsername, text } = sendGroupMessageDto;
    console.log('📤 Sending message in group chat:', groupChatId);

    if (!Types.ObjectId.isValid(groupChatId) || !Types.ObjectId.isValid(senderId)) {
      throw new BadRequestException('Invalid group chat ID or sender ID format');
    }

    const groupChat = await this.groupChatModel
      .findById(groupChatId)
      .populate('members', 'username _id')
      .exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Check if sender is a member
    if (!groupChat.members.some(member => member._id.toString() === senderId)) {
      throw new BadRequestException('User is not a member of this group chat');
    }

    const newMessage = {
      _id: new Types.ObjectId(),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      text: text.trim(),
      timestamp: new Date()
    };

    // Add message to group chat
    groupChat.messages.push(newMessage as GroupMessage);

    // Update last message
    groupChat.lastMessage = newMessage as GroupMessage;
    groupChat.updatedAt = new Date();

    await groupChat.save();
    console.log('✅ Group message sent successfully');

    // Send notifications to all group members except the sender
    try {
      const memberIds = groupChat.members
        .filter(member => member._id.toString() !== senderId)
        .map(member => member._id.toString());
      
      if (memberIds.length > 0) {
        console.log('📢 Sending notifications to group members:', memberIds.length);
        
        // Use the notification gateway for group message notifications
        await this.notificationGateway.sendMessageNotification({
          recipientId: 'GROUP', // Special indicator for group messages
          senderId: senderId,
          senderUsername: senderUsername,
          chatId: groupChatId,
          messageText: text.trim(),
          isGroup: true,
          groupName: groupChat.name,
        });

        // Send individual notifications to each member
        for (const memberId of memberIds) {
          try {
            await this.notificationGateway.sendMessageNotification({
              recipientId: memberId,
              senderId: senderId,
              senderUsername: senderUsername,
              chatId: groupChatId,
              messageText: text.trim(),
              isGroup: true,
              groupName: groupChat.name,
            });
          } catch (memberError) {
            console.error(`❌ Failed to send notification to member ${memberId}:`, memberError);
            // Continue with other members if one fails
          }
        }
        
        console.log('✅ Group notifications sent successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send group notifications:', error);
      // Don't fail the message sending if notification fails
    }

    return this.toGroupMessageType(newMessage as GroupMessage);
  }

  async getGroupChatDetails(groupChatId: string): Promise<GroupChatType> {
    console.log('🔍 Getting group chat details:', groupChatId);
    
    if (!Types.ObjectId.isValid(groupChatId)) {
      throw new BadRequestException('Invalid group chat ID format');
    }

    const groupChat = await this.groupChatModel
      .findById(groupChatId)
      .populate('members', 'username email lastActive createdAt')
      .populate('createdBy', 'username email')
      .exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    return this.toGroupChatType(groupChat);
  }

  async updateGroupChat(groupChatId: string, updateGroupChatDto: UpdateGroupChatDto): Promise<GroupChatType> {
    console.log('🔍 Updating group chat:', groupChatId);
    
    if (!Types.ObjectId.isValid(groupChatId)) {
      throw new BadRequestException('Invalid group chat ID format');
    }

    const groupChat = await this.groupChatModel.findById(groupChatId).exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Update fields
    if (updateGroupChatDto.name !== undefined) {
      groupChat.name = updateGroupChatDto.name.trim();
    }
    if (updateGroupChatDto.description !== undefined) {
      groupChat.description = updateGroupChatDto.description?.trim();
    }
    if (updateGroupChatDto.groupIcon !== undefined) {
      groupChat.groupIcon = updateGroupChatDto.groupIcon?.trim();
    }

    groupChat.updatedAt = new Date();
    await groupChat.save();

    // Return populated group chat
    const updatedGroupChat = await this.groupChatModel
      .findById(groupChatId)
      .populate('members', 'username email lastActive createdAt')
      .populate('createdBy', 'username email')
      .exec();

    return this.toGroupChatType(updatedGroupChat!);
  }

  async addMemberToGroup(groupChatId: string, userId: string): Promise<GroupChatType> {
    console.log('👥 Adding member to group:', { groupChatId, userId });
    
    if (!Types.ObjectId.isValid(groupChatId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid group chat ID or user ID format');
    }

    const groupChat = await this.groupChatModel.findById(groupChatId).exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Check if user is already a member
    if (groupChat.members.some(member => member.toString() === userId)) {
      throw new BadRequestException('User is already a member of this group');
    }

    groupChat.members.push(new Types.ObjectId(userId));
    groupChat.updatedAt = new Date();
    await groupChat.save();

    // Return populated group chat
    const updatedGroupChat = await this.groupChatModel
      .findById(groupChatId)
      .populate('members', 'username email lastActive createdAt')
      .populate('createdBy', 'username email')
      .exec();

    return this.toGroupChatType(updatedGroupChat!);
  }

  async removeMemberFromGroup(groupChatId: string, userId: string): Promise<GroupChatType> {
    console.log('👥 Removing member from group:', { groupChatId, userId });
    
    if (!Types.ObjectId.isValid(groupChatId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid group chat ID or user ID format');
    }

    const groupChat = await this.groupChatModel.findById(groupChatId).exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Check if user is a member
    if (!groupChat.members.some(member => member.toString() === userId)) {
      throw new BadRequestException('User is not a member of this group');
    }

    // Don't allow removing the creator
    if (groupChat.createdBy.toString() === userId) {
      throw new BadRequestException('Cannot remove the group creator');
    }

    groupChat.members = groupChat.members.filter(member => member.toString() !== userId);
    groupChat.updatedAt = new Date();
    await groupChat.save();

    // Return populated group chat
    const updatedGroupChat = await this.groupChatModel
      .findById(groupChatId)
      .populate('members', 'username email lastActive createdAt')
      .populate('createdBy', 'username email')
      .exec();

    return this.toGroupChatType(updatedGroupChat!);
  }

  async leaveGroup(groupChatId: string, userId: string): Promise<{ success: boolean; message: string; deleted?: boolean }> {
    console.log('🚪 User leaving group:', { groupChatId, userId });
    // Leave group functionality

    if (!Types.ObjectId.isValid(groupChatId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid group chat ID or user ID format');
    }

    const groupChat = await this.groupChatModel.findById(groupChatId).exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Check if user is a member
    if (!groupChat.members.some(member => member.toString() === userId)) {
      throw new BadRequestException('User is not a member of this group');
    }

    // If user is the creator, delete the entire group
    if (groupChat.createdBy.toString() === userId) {
      console.log('👑 Creator is leaving, deleting group');
      await this.groupChatModel.findByIdAndDelete(groupChatId).exec();
      return {
        success: true,
        message: 'Group deleted successfully as you were the creator',
        deleted: true
      };
    }

    // If user is a regular member, remove them from the group
    console.log('👤 Regular member leaving group');
    groupChat.members = groupChat.members.filter(member => member.toString() !== userId);
    groupChat.updatedAt = new Date();
    await groupChat.save();

    return {
      success: true,
      message: 'Left group successfully',
      deleted: false
    };
  }

  async deleteGroupChat(groupChatId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(groupChatId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid group chat ID or user ID format');
    }

    const groupChat = await this.groupChatModel.findById(groupChatId).exec();

    if (!groupChat) {
      throw new NotFoundException('Group chat not found');
    }

    // Only creator can delete the group
    if (groupChat.createdBy.toString() !== userId) {
      throw new BadRequestException('Only the group creator can delete the group');
    }

    await this.groupChatModel.findByIdAndDelete(groupChatId).exec();
  }

  private toGroupChatType(groupChat: GroupChatDocument): GroupChatType {
    if (!groupChat) {
      throw new Error('Group chat document is null or undefined');
    }
    
    try {
      console.log('🔄 Converting group chat to GroupChatType');
      
      return {
        _id: groupChat._id.toString(),
        name: groupChat.name,
        description: groupChat.description,
        groupIcon: groupChat.groupIcon,
        members: groupChat.members,
        createdBy: groupChat.createdBy.toString(),
        messages: groupChat.messages ? groupChat.messages.map(message => this.toGroupMessageType(message)) : [],
        lastMessage: groupChat.lastMessage ? this.toGroupMessageType(groupChat.lastMessage) : undefined,
        createdAt: groupChat.createdAt,
        updatedAt: groupChat.updatedAt
      };
    } catch (error) {
      console.error('❌ Error in toGroupChatType:', error);
      throw new BadRequestException(`Failed to convert group chat: ${error.message}`);
    }
  }

  private toGroupMessageType(message: GroupMessage): GroupMessageType {
    return {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      senderUsername: message.senderUsername,
      text: message.text,
      timestamp: message.timestamp
    };
  }
}