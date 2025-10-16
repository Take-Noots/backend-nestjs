import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SongPost, SongPostDocument } from '@modules/songPost/songPost.model';
import { Profile, ProfileDocument } from '@modules/profile/profile.model';
import { randomInt } from 'crypto'; // or Math.random

@Injectable()
export class SearchService {
  constructor(
    private readonly userService: UserService,
    @InjectModel(SongPost.name) private songPostModel: Model<SongPostDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async search(query: string) {
    let users: any[] = [];
    let songPosts: any[] = [];
    let profiles: any[] = [];
    
    if (!query) {
      // Use ExploreAlgorithm to get ranked posts for explore feed
      const exploreResult = await this.ExploreAlgorithm();
      // Return the explore result directly since it's already processed with user info
      return exploreResult;
    } else {
      // Enhanced search for profiles - only return profiles where search term matches start of first or last name
      profiles = await this.searchProfilesByName(query);
      
      // Keep existing username search for users
      users = await this.userService.findAllWithPagination({ username: { $regex: query, $options: 'i' } });
      
      songPosts = await this.songPostModel.find({
        $or: [
          { songName: { $regex: query, $options: 'i' } },
          { artists: { $regex: query, $options: 'i' } },
          { caption: { $regex: query, $options: 'i' } },
        ],
        isDeleted: { $ne: 1 },
      }).exec();
    }

    // For each song post, fetch username and profile image using userId
    const songPostsWithUser = await Promise.all(songPosts.map(async post => {
      let username = '';
      let userImage = '';
      try {
        // Fetch user
        const user = post.userId ? await this.userService.findById(post.userId) : null;
        username = user?.username || 'Unknown User';
        // Fetch profile
        const profile = post.userId ? await this.profileModel.findOne({ userId: post.userId }).lean() : null;
        userImage = profile?.profileImage || '';
      } catch (e) {
        username = 'Unknown User';
        userImage = '';
      }
      return {
        id: post._id,
        name: post.songName,
        artists: post.artists,
        caption: post.caption,
        albumImage: post.albumImage,
        createdAt: post.createdAt,
        username,
        userImage,
        trackId: post.trackId,
        likes: post.likes || 0,
        comments: post.comments || [],
        commentsCount: post.comments ? post.comments.length : 0,
        likedBy: post.likedBy || [],
        updatedAt: post.updatedAt || new Date(),
      };
    }));

    return {
      users: users.map(user => ({ id: user._id, name: user.username, type: 'user' })),
      fanbases: [],
      posts: [],
      profiles: profiles.map(profile => ({ 
        id: profile._id, 
        name: profile.fullName || 'Unknown', 
        type: 'profile',
        userId: profile.userId,
        profileImage: profile.profileImage || '',
        profileUrl: `/profile/${profile.userId}`,
        clickable: true
      })),
      songPosts: songPostsWithUser,
    };
  }

async ExploreAlgorithm() {
  console.log('🔍 ExploreAlgorithm called - using generic algorithm for all users');
  
  // Fetch all posts (you may want filters here later)
  const songPosts = await this.songPostModel.find({}).sort({ createdAt: 1 }).exec();
  console.log('📊 Total song posts found in database:', songPosts.length);
  
  if (songPosts.length === 0) {
    console.log('❌ No song posts found in database - this is likely the main issue');
  }

  // Helper to assign base points - always use generic algorithm
  function getBasePoints(post: any): number {
    let basePoints = 0;
    let reason = '';
    
    // Popular posts (works for all users)
    if ((post.likes || 0) > 50) { // threshold can be tuned
      basePoints = 2000;
      reason = 'popular post';
    }
    
    // Random fallback with some variation
    if (basePoints === 0) {
      basePoints = 500 + randomInt(200); // Random value between 500-700
      reason = 'random fallback';
    }
    
    console.log(`📈 Post ${post._id}: base points = ${basePoints} (${reason})`);
    return basePoints;
  }

  // Decay constant
  const lambda = 0.002; // ~0.05/day (tunable)

  const now = new Date();

  // For each song post, fetch username/profile and calculate SugValue
  const songPostsWithUser = await Promise.all(songPosts.map(async post => {
    let username = '';
    let userImage = '';
    try {
      const user = post.userId ? await this.userService.findById(post.userId) : null;
      username = user?.username || 'Unknown User';

      const profile = post.userId ? await this.profileModel.findOne({ userId: post.userId }).lean() : null;
      userImage = profile?.profileImage || '';
    } catch (e) {
      username = 'Unknown User';
      userImage = '';
    }

    // --- Algorithm scoring ---
    const points = getBasePoints(post);

    // Random factor by category
    let randomFactor = 1.0;
    if (points === 2000) randomFactor = (Math.random() * 0.15) + 0.90; // 0.90–1.05
    else randomFactor = (Math.random() * 0.20) + 0.90; // 0.90–1.10

    // Engagement factor
    const likes = post.likes || 0;
    const engagementFactor = 1 + Math.log(1 + likes);

    // Time decay
    const ageHours = Math.max(1, (now.getTime() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    const decay = Math.exp(-lambda * ageHours);

    // Final SugValue
    const sugValue = (points * randomFactor * engagementFactor) * decay;

    console.log(`   🎲 Random factor: ${randomFactor.toFixed(3)}`);
    console.log(`   ❤️  Engagement factor: ${engagementFactor.toFixed(3)} (${likes} likes)`);
    console.log(`   ⏰ Age: ${ageHours.toFixed(1)} hours, Decay: ${decay.toFixed(3)}`);
    console.log(`   💯 Final sugValue: ${sugValue.toFixed(2)}`);

    return {
      id: post._id,
      name: post.songName,
      artists: post.artists,
      caption: post.caption,
      albumImage: post.albumImage,
      createdAt: post.createdAt,
      username,
      userImage,
      trackId: post.trackId,
      likes: post.likes || 0,
      comments: post.comments || [],
      commentsCount: post.comments ? post.comments.length : 0,
      likedBy: post.likedBy || [],
      updatedAt: post.updatedAt || new Date(),
      sugValue: sugValue, // add calculated score
    };
  }));

  // Sort by SugValue (highest first)
  const rankedPosts = songPostsWithUser.sort((a, b) => b.sugValue - a.sugValue);

  console.log('🏆 Final ranked posts:');
  rankedPosts.forEach((post, index) => {
    console.log(`   ${index + 1}. ${post.name} by ${post.artists} - sugValue: ${post.sugValue.toFixed(2)}`);
  });
  console.log(`📋 Total ranked posts returned: ${rankedPosts.length}`);

    return {
      users: [],
      fanbases: [],
      posts: [],
      profiles: [],
      songPosts: rankedPosts,
    };
}

  private async searchProfilesByName(query: string): Promise<any[]> {
    const searchTerm = query.toLowerCase().trim();
    
    // Don't return anything for empty queries
    if (!searchTerm) return [];
    
    // Get all profiles and filter them based on name matching criteria
    const allProfiles = await this.profileModel.find({ fullName: { $exists: true, $ne: '' } }).lean();
    
    const filteredProfiles = allProfiles.filter(profile => {
      if (!profile.fullName) return false;
      
      const fullName = profile.fullName.trim();
      if (!fullName) return false;
      
      // Split the full name into parts and filter out empty strings
      const nameParts = fullName.split(/\s+/).filter(part => part.length > 0);
      
      if (nameParts.length === 0) return false;
      
      // Check if search term matches the start of first name
      const firstName = nameParts[0].toLowerCase();
      if (firstName.length >= searchTerm.length && 
          firstName.substring(0, searchTerm.length) === searchTerm) {
        return true;
      }
      
      // Check if search term matches the start of last name (last part)
      if (nameParts.length > 1) {
        const lastName = nameParts[nameParts.length - 1].toLowerCase();
        if (lastName.length >= searchTerm.length && 
            lastName.substring(0, searchTerm.length) === searchTerm) {
          return true;
        }
      }
      
      return false;
    });

    return filteredProfiles;
  }
}
