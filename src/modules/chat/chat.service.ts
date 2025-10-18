// src/modules/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, Message } from './chat.model';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatType, MessageType } from '../../common/interfaces/chat.interface';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private readonly httpService: HttpService,
    private readonly notificationGateway: NotificationGateway, // Add notification gateway
  ) {}

  async getUserChats(userId: string): Promise<ChatType[]> {
    console.log('📋 Getting chats for user:', userId);
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    try {
      const chats = await this.chatModel
        .find({ participants: userId })
        .populate('participants', 'username email lastActive createdAt')
        .sort({ updatedAt: -1 }) // Sort by updatedAt instead of lastMessage.timestamp
        .exec();

      console.log('📊 Found chats:', chats.length);
      return chats.filter(chat => chat !== null).map(chat => this.toChatType(chat));
    } catch (error) {
      console.error('❌ Error in getUserChats:', error);
      throw error;
    }
  }

  async getChatMessages(chatId: string): Promise<MessageType[]> {
    console.log('📨 Getting messages for chat:', chatId);
    
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID format');
    }

    const chat = await this.chatModel.findById(chatId).exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Sort messages by timestamp
    const messages = chat.messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log('📨 Found messages:', messages.length);
    return messages.map(message => this.toMessageType(message));
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<MessageType> {
    const { chatId, senderId, senderUsername, text } = sendMessageDto;
    console.log('📤 Sending message in chat:', chatId);

    if (!Types.ObjectId.isValid(chatId) || !Types.ObjectId.isValid(senderId)) {
      throw new BadRequestException('Invalid chat ID or sender ID format');
    }

    const chat = await this.chatModel.findById(chatId).populate('participants', 'username').exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check if sender is a participant
    if (!chat.participants.some(participant => participant._id.toString() === senderId)) {
      throw new BadRequestException('User is not a participant in this chat');
    }

    const newMessage = {
      _id: new Types.ObjectId(),
      senderId: new Types.ObjectId(senderId),
      senderUsername,
      text: text.trim(),
      timestamp: new Date()
    };

    // Add message to chat
    chat.messages.push(newMessage as Message);

    // Update last message
    chat.lastMessage = newMessage as Message;
    chat.updatedAt = new Date();

    await chat.save();
    console.log('✅ Message sent successfully');

    // Send notification to the other participant using NotificationGateway
    try {
      const recipient = chat.participants.find(participant => 
        participant._id.toString() !== senderId
      );
      
      if (recipient) {
        console.log('📢 Sending notification to:', recipient._id.toString());
        
        // Use the notification gateway for real-time notifications
        await this.notificationGateway.sendMessageNotification({
          recipientId: recipient._id.toString(),
          senderId: senderId,
          senderUsername: senderUsername,
          chatId: chatId,
          messageText: text.trim(),
        });
        
        console.log('✅ Notification sent successfully');
      }
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      // Don't fail the message sending if notification fails
    }

    return this.toMessageType(newMessage as Message);
  }

  async createChat(createChatDto: CreateChatDto): Promise<ChatType> {
    const { senderId, receiverId } = createChatDto;
    
    console.log('🔄 Creating chat between:', { senderId, receiverId });

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(senderId)) {
      console.log('❌ Invalid senderId format:', senderId);
      throw new BadRequestException('Invalid senderId format');
    }
    
    if (!Types.ObjectId.isValid(receiverId)) {
      console.log('❌ Invalid receiverId format:', receiverId);
      throw new BadRequestException('Invalid receiverId format');
    }

    if (senderId === receiverId) {
      console.log('❌ Cannot create chat with yourself');
      throw new BadRequestException('Cannot create chat with yourself');
    }

    try {
      // Check if chat already exists
      console.log('🔍 Checking if chat already exists...');
      const existingChat = await this.chatModel
        .findOne({
          participants: { $all: [senderId, receiverId] },
          $expr: { $eq: [{ $size: '$participants' }, 2] }
        })
        .populate('participants', 'username email lastActive createdAt')
        .exec();

      if (existingChat) {
        console.log('✅ Found existing chat:', existingChat._id);
        return this.toChatType(existingChat);
      }

      console.log('🔍 Creating new chat...');
      
      // Create chat data object (let Mongoose auto-generate _id)
      const chatData = {
        participants: [new Types.ObjectId(senderId), new Types.ObjectId(receiverId)],
        messages: [],
        // Don't include lastMessage if it's undefined
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('💾 Saving new chat...');
      const newChat = await this.chatModel.create(chatData); // Use create instead of new + save
      console.log('✅ Chat saved with ID:', newChat._id);

      // Populate participants before returning
      console.log('👥 Populating participants...');
      const populatedChat = await this.chatModel
        .findById(newChat._id)
        .populate('participants', 'username email lastActive createdAt')
        .exec();

      if (!populatedChat) {
        console.log('❌ Failed to populate chat');
        throw new NotFoundException('Failed to create and populate chat');
      }

      console.log('✅ Chat created successfully');
      return this.toChatType(populatedChat);

    } catch (error) {
      console.error('❌ Error in createChat:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 500)
      });
      
      // Re-throw known errors
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new BadRequestException(`Failed to create chat: ${error.message}`);
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(chatId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid chat ID or user ID format');
    }

    const chat = await this.chatModel.findById(chatId).exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check if user is a participant
    if (!chat.participants.some(participant => participant.toString() === userId)) {
      throw new BadRequestException('User is not a participant in this chat');
    }

    await this.chatModel.findByIdAndDelete(chatId).exec();
  }

  private toChatType(chat: ChatDocument): ChatType {
    if (!chat) {
      throw new Error('Chat document is null or undefined');
    }
    
    try {
      console.log('🔄 Converting chat to ChatType');
      
      return {
        _id: chat._id.toString(),
        participants: chat.participants,
        messages: chat.messages ? chat.messages.map(message => this.toMessageType(message)) : [],
        lastMessage: chat.lastMessage ? this.toMessageType(chat.lastMessage) : undefined,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    } catch (error) {
      console.error('❌ Error in toChatType:', error);
      throw new BadRequestException(`Failed to convert chat: ${error.message}`);
    }
  }

  private toMessageType(message: Message): MessageType {
    return {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      senderUsername: message.senderUsername,
      text: message.text,
      timestamp: message.timestamp
    };
  }
}