// src/common/interfaces/fanbase.interface.ts
export interface FanbaseType {
  _id: string;
  fanbaseName: string;
  topic: string;
  fanbasePhotoUrl?: string;
  numberOfLikes: number;
  likedUserIds: string[];
  numberOfPosts: number;
  postIds: string[];
  numberOfShares: number;
  createdAt: Date;
  // Creator details with ID
  createdBy: {
    _id: string;
    username: string;
  };
}
