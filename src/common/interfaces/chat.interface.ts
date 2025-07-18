// src/common/interfaces/chat.interface.ts
import { Types } from 'mongoose';

export interface MessageType {
  _id: string;
  senderId: string;
  senderUsername: string;
  text: string;
  timestamp: Date;
}

export interface ChatType {
  _id: string;
  participants: string[];
  messages: MessageType[];
  lastMessage?: MessageType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  _id: string;
  username: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen: Date;
}