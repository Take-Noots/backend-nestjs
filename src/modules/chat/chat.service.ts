// src/modules/chat/chat.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument, Message } from './chat.model';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatType, MessageType } from '../../common/interfaces/chat.interface';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async getUserChats(userId: string): Promise<ChatType[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const chats = await this.chatModel
      .find({ participants: userId })
      .populate('participants', 'username profileImage isOnline lastSeen')
      .sort({ 'lastMessage.timestamp': -1 })
      .exec();

    return chats.filter(chat => chat !== null).map(chat => this.toChatType(chat));
  }

  async getChatMessages(chatId: string): Promise<MessageType[]> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new BadRequestException('Invalid chat ID');
    }

    const chat = await this.chatModel.findById(chatId).exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Sort messages by timestamp
    const messages = chat.messages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return messages.map(message => this.toMessageType(message));
  }

  async sendMessage(sendMessageDto: SendMessageDto): Promise<MessageType> {
    const { chatId, senderId, senderUsername, text } = sendMessageDto;

    if (!Types.ObjectId.isValid(chatId) || !Types.ObjectId.isValid(senderId)) {
      throw new BadRequestException('Invalid chat ID or sender ID');
    }

    const chat = await this.chatModel.findById(chatId).exec();

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Check if sender is a participant
    if (!chat.participants.some(participant => participant.toString() === senderId)) {
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

    return this.toMessageType(newMessage as Message);
  }

  async createChat(createChatDto: CreateChatDto): Promise<ChatType> {
    const { senderId, receiverId } = createChatDto;

    if (!Types.ObjectId.isValid(senderId) || !Types.ObjectId.isValid(receiverId)) {
      throw new BadRequestException('Invalid user IDs');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot create chat with yourself');
    }

    // Check if chat already exists
    const existingChat = await this.chatModel
      .findOne({
        participants: { $all: [senderId, receiverId] }
      })
      .populate('participants', 'username profileImage isOnline lastSeen')
      .exec();

    if (existingChat) {
      return this.toChatType(existingChat);
    }

    // Create new chat
    const newChat = new this.chatModel({
      participants: [senderId, receiverId],
      messages: [],
      lastMessage: null
    });

    await newChat.save();

    // Populate participants before returning
    const populatedChat = await this.chatModel
      .findById(newChat._id)
      .populate('participants', 'username profileImage isOnline lastSeen')
      .exec();

    if (!populatedChat) {
      throw new NotFoundException('Failed to create chat');
    }

    return this.toChatType(populatedChat);
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(chatId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid chat ID or user ID');
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
    
    return {
      _id: chat._id.toString(),
      participants: chat.participants.map(p => p.toString()),
      messages: chat.messages.map(message => this.toMessageType(message)),
      lastMessage: chat.lastMessage ? this.toMessageType(chat.lastMessage) : undefined,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };
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