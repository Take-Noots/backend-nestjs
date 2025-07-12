export class ProfileDto {
  _id: string;
  userId: string;
  username: string;
  profileImage: string;
  bio: string;
  posts: number;
  followers: number;
  following: number;
  albumArts: string[];
}
