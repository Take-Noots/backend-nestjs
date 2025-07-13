// src/common/interfaces/user.interface.ts
export interface UserType {
  _id: string;
  email: string;
  username: string;
  password: string;
  role: string;
  profileImage?: string;
  posts?: number;
  followers?: number;
  following?: number;
  albumArts?: string[];
  profileBio?: string[];
  isBlocked?: boolean;
  banReason?: string;
  bannedBy?: string;
  bannedAt?: Date;
  banUntil?: Date;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserType;
    }
  }
}