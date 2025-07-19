// src/common/interfaces/post.interface.ts
export interface PostType {
  _id: string;
  userId: string;
  description: string;
  postType: string;
  spotifyTrackId: string;
  songTitle: string;
  artistName: string;
  albumArt: string;
  albumName?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  fanbaseId?: string;
  isReported: boolean;
  isDeleted: boolean;
  deletedReason?: string;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}