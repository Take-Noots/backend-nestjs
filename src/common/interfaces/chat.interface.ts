// src/common/interfaces/chat.interface.ts
// src/common/interfaces/chat.interface.ts
export interface MessageType {
  _id: string;
  senderId: string;
  senderUsername: string;
  text: string;
  timestamp: Date;
}

export interface ChatType {
  _id: string;
  participants: any[];
  messages: MessageType[];
  lastMessage?: MessageType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserType {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  isOnline: boolean;
  lastSeen: Date;
}