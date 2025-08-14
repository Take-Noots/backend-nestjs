// src/common/interfaces/post.interface.ts
export interface PostType {
  _id: string;
  createdBy: {
    userId: string;
    userName: string;
  };
  topic: string;
  description: string;
  spotifyTrackId?: string;
  songName?: string;
  artistName?: string;
  albumArt?: string;
  likesCount: number;
  likeUserIds: string[];
  commentsCount: number;
  comments: {
    userId: string;
    userName: string;
    comment: string;
    likeCount: number;
    likeUserIds: string[];
    createdAt: Date;
  }[];
  fanbaseId: string;
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean; // For frontend usage
}