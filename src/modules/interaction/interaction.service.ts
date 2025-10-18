import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecentlyLikedUserList } from './interaction.model';

@Injectable()
export class RecentlyLikedUserService {
  constructor(
    @InjectModel(RecentlyLikedUserList.name) private model: Model<RecentlyLikedUserList>,
  ) {}

  // Add or update the recently liked post list for a user
  async addInteraction(userId: string, likedPostId: string) {
    // Find the user's list
    let doc = await this.model.findOne({ userId });

    if (!doc) {
      // Create new if it doesn't exist
      doc = new this.model({ userId, recentlyLikedPostIds: [likedPostId] });
    } else {
      const existing = Array.isArray(doc.recentlyLikedPostIds) ? doc.recentlyLikedPostIds : [];
      // If already present, do nothing
      if (existing.includes(likedPostId)) {
        return { success: true };
      }
      // Add to the front
      doc.recentlyLikedPostIds = [likedPostId, ...existing];
      // Cap to 5 items (FIFO: newest at front, drop extras at end)
      if (doc.recentlyLikedPostIds.length > 5) {
        doc.recentlyLikedPostIds = doc.recentlyLikedPostIds.slice(0, 5);
      }
    }
    await doc.save();
    return { success: true };
  }

  async getRecentlyLikedUsers(userId: string) {
    const doc = await this.model.findOne({ userId });
    return doc ? doc.recentlyLikedPostIds ?? [] : [];
  }
}
