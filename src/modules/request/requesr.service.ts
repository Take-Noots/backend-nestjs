import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request, RequestDocument, RequestRespondStatus } from './request.model';
import { UserService } from '../user/user.service';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request.name) private readonly requestModel: Model<RequestDocument>,
    private readonly userService: UserService,
  ) {}

  async getPendingRequests() {
    // Get all pending requests
    const requests = await this.requestModel.find({ respond: RequestRespondStatus.PENDING }, 'requestSendUserId respond').lean();
    // For each request, fetch the sender's username from UserService
    const results = await Promise.all(requests.map(async (req: any) => {
      const username = await this.userService.getUsernameById(req.requestSendUserId);
      return {
        requestSendUserId: req.requestSendUserId,
        respond: req.respond,
        username: username || null,
      };
    }));
    return results;
  }

  async confirmRequest(requestSendUserId: string, requestReceiveUserId: string) {
    const updated = await this.requestModel.findOneAndUpdate(
      {
        requestSendUserId,
        requestReceiveUserId,
        respond: RequestRespondStatus.PENDING,
      },
      { respond: RequestRespondStatus.CONFIRM },
      { new: true }
    );
    
    return updated;
  }
} 
