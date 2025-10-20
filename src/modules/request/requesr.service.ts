import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Request,
  RequestDocument,
  RequestRespondStatus,
} from './request.model';
import { UserService } from '../user/user.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  async getPendingRequests() {
    // Get all pending requests
    const requests = await this.requestModel
      .find(
        { respond: RequestRespondStatus.PENDING },
        'requestSendUserId respond',
      )
      .lean();
    // For each request, fetch the sender's username from UserService
    const results = await Promise.all(
      requests.map(async (req: any) => {
        const username = await this.userService.getUsernameById(
          req.requestSendUserId,
        );
        return {
          requestSendUserId: req.requestSendUserId,
          respond: req.respond,
          username: username || null,
        };
      }),
    );
    return results;
  }

  async confirmRequest(
    requestSendUserId: string,
    requestReceiveUserId: string,
  ) {
    try {
      const updated = await this.requestModel.findOneAndUpdate(
        {
          requestSendUserId,
          requestReceiveUserId,
          respond: RequestRespondStatus.PENDING,
        },
        { respond: RequestRespondStatus.CONFIRM },
        { new: true },
      );
      await this.profileService.addFollowers(
        requestReceiveUserId,
        requestSendUserId,
      );
      return updated;
    } catch (e) {
      console.log('confirm Request error: ', e.message);
    }
    // Add follower relationship
  }

  // Create a follow/request record (send a follow request)
  async createRequest(requestSendUserId: string, requestReceiveUserId: string) {
    try {
      // check for any existing request record between these users
      const existing = await this.requestModel
        .findOne({
          requestSendUserId,
          requestReceiveUserId,
        })
        .lean();

      if (existing) {
        // If a pending request already exists, don't create another
        if (existing.respond === RequestRespondStatus.PENDING) {
          return { success: false, message: 'Request already pending' };
        }

        // If already confirmed, user is already a follower
        if (existing.respond === RequestRespondStatus.CONFIRM) {
          return { success: false, message: 'User already followed' };
        }

        // If previous request was rejected or canceled, allow re-sending by updating same document
        if (
          existing.respond === RequestRespondStatus.REJECT ||
          existing.respond === RequestRespondStatus.CANCEL
        ) {
          const updated = await this.requestModel.findByIdAndUpdate(
            existing._id,
            {
              respond: RequestRespondStatus.PENDING,
              requestSendDate: new Date(),
            },
            { new: true },
          );
          return {
            success: true,
            message: 'Follow request re-sent',
            data: updated,
          };
        }
      }

      // create a new request document
      const req = new this.requestModel({
        requestSendUserId,
        requestReceiveUserId,
        respond: RequestRespondStatus.PENDING,
        requestSendDate: new Date(),
      });
      await req.save();
      return { success: true, message: 'Follow request created' };
    } catch (e) {
      console.log('createRequest error', e.message);
      return { success: false, message: e.message };
    }
  }

  // Get pending requests for a specific target user
  async getRequestsForUser(requestReceiveUserId: string) {
    const requests = await this.requestModel
      .find({
        requestReceiveUserId,
        respond: RequestRespondStatus.PENDING,
      })
      .lean();

    // enrich with user info
    const results = await Promise.all(
      requests.map(async (r: any) => {
        const username = await this.userService.getUsernameById(
          r.requestSendUserId,
        );
        const profile = await this.profileService.getProfileByUserId(
          r.requestSendUserId,
        );
        return {
          _id: r._id,
          userId: r.requestSendUserId,
          username: username || null,
          profileImage: profile?.profileImage || '',
          fullName: profile?.fullName || '',
          requestSendDate: r.requestSendDate,
        };
      }),
    );
    return results;
  }

  // Reject (or delete) a follow request
  async rejectRequest(requestSendUserId: string, requestReceiveUserId: string) {
    try {
      const updated = await this.requestModel.findOneAndUpdate(
        {
          requestSendUserId,
          requestReceiveUserId,
          respond: RequestRespondStatus.PENDING,
        },
        { respond: RequestRespondStatus.REJECT },
        { new: true },
      );
      return { success: true, message: 'Request rejected', data: updated };
    } catch (e) {
      console.log('rejectRequest error', e.message);
      return { success: false, message: e.message };
    }
  }

  // Cancel a follow request (initiated by the requester)
  async cancelRequest(requestSendUserId: string, requestReceiveUserId: string) {
    try {
      const updated = await this.requestModel.findOneAndUpdate(
        {
          requestSendUserId,
          requestReceiveUserId,
          respond: RequestRespondStatus.PENDING,
        },
        { respond: RequestRespondStatus.CANCEL },
        { new: true },
      );
      return { success: true, message: 'Request canceled', data: updated };
    } catch (e) {
      console.log('cancelRequest error', e.message);
      return { success: false, message: e.message };
    }
  }
}
