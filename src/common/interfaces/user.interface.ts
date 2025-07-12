export interface UserType {
  _id: string;
  email: string;
  username: string;
  password: string;
  role: string;
  profileImage?: string;
  posts?: number;
  followers?: number;
  following?: number;
  albumArts?: string[];
  profileBio?: string[];
}
