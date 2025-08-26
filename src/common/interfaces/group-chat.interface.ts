// src/common/interfaces/group-chat.interface.ts
export interface GroupMessageType {
  _id: string;
  senderId: string;
  senderUsername: string;
  text: string;
  timestamp: Date;
}

export interface GroupChatType {
  _id: string;
  name: string;
  description?: string;
  groupIcon?: string;
  members: any[]; // Populated user objects
  createdBy: string;
  messages: GroupMessageType[];
  lastMessage?: GroupMessageType;
  createdAt: Date;
  updatedAt: Date;
}