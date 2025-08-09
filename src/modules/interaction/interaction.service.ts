import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecentlyLikedUserList } from './interaction.model';

@Injectable()
export class RecentlyLikedUserService {
  constructor(
    @InjectModel(RecentlyLikedUserList.name) private model: Model<RecentlyLikedUserList>,
  ) {}

  // Add or update the recently liked user list for a user
  async addInteraction(userId: string, likedUserId: string) {
    console.log('addInteraction called with:', userId, likedUserId);
    // Find the user's list
    let doc = await this.model.findOne({ userId });

    if (!doc) {
      // Create new if doesn't exist
      doc = new this.model({ userId, recentlyLikedUserIds: [likedUserId] });
    } else {
      // Remove if already exists to avoid duplicates, then add to front
      doc.recentlyLikedUserIds = doc.recentlyLikedUserIds.filter(id => id !== likedUserId);
      doc.recentlyLikedUserIds.unshift(likedUserId);
      // Keep only 5
      if (doc.recentlyLikedUserIds.length > 5) {
        doc.recentlyLikedUserIds = doc.recentlyLikedUserIds.slice(0, 5);
      }
    }
    await doc.save();
    return { success: true };
  }

  async getRecentlyLikedUsers(userId: string) {
    const doc = await this.model.findOne({ userId });
    return doc ? doc.recentlyLikedUserIds : [];
  }
}
