export class ProfileDto {
  _id: string;
  userId: string;
  profileImage: string;
  username: string;
  bio: string;
  email: string;
  posts: number;
  followers: string[];
  following: string[];
  albumArts: string[];
}
