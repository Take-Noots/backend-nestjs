// src/modules/posts/dto/create-post.dto.ts
export class CreatePostDTO {
  userId: string;
  description: string;
  postType: string;
  spotifyTrackId: string;
  songTitle: string;
  artistName: string;
  albumArt: string;
  albumName?: string;
  fanbaseId?: string;
}