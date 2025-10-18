export class ProfileDto {
  _id: string;
  userId: string;
  userType: string;
  profileImage: string;
  username: string;
  fullName: string;
  bio: string;
  email: string;
  posts: number;
  followers: string[];
  following: string[];
  albumArts: string[];
  savedPosts: string[];
  savedThoughtsPosts: string[];
}
