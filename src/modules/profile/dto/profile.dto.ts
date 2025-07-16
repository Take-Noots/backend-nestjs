export class ProfileDto {
  _id: string;
  userId: string;
  profileImage: string;
  bio: string;
  posts: number;
  followers: string[];
  following: string[];
  albumArts: string[];
}
