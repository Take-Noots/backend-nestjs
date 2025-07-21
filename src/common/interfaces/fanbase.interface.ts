// src/common/interfaces/fanbase.interface.ts
export interface FanbaseType {
  _id: string;
  fanbaseName: string;
  topic: string;
  createdUserId: string; // Match database field
  fanbasePhotoUrl?: string;
  numberOfLikes: number;
  likedUserIds: string[]; // Array of user IDs who liked
  numberOfPosts: number; // Number of posts in this fanbase
  postIds: string[]; // Array of post IDs
  numberOfComments: number; // Total comments across all posts
  createdAt: Date;
  __v?: number; // Mongoose version field
}
