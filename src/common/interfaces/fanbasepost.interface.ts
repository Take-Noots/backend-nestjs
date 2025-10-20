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
  isLiked?: boolean;
  commentsCount: number;
  comments: {
    commentId: string; // ✅ Changed from commentIndex
    userId: string;
    userName: string;
    comment: string;
    likeCount: number;
    likeUserIds: string[];
    isLiked?: boolean;
    createdAt: Date;
    subComments: {
      commentId: string; // ✅ Changed from commentIndex
      userId: string;
      userName: string;
      comment: string;
      likeCount: number;
      likeUserIds: string[];
      isLiked?: boolean;
      createdAt: Date;
    }[];
  }[];
  fanbaseId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}