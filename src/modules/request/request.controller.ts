import { Controller, Get, Body, Patch, Post, Param } from '@nestjs/common';
import { RequestService } from './requesr.service';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  // create a follow request
  @Post('create')
  async createRequest(
    @Body() body: { requestSendUserId: string; requestReceiveUserId: string },
  ) {
    return this.requestService.createRequest(
      body.requestSendUserId,
      body.requestReceiveUserId,
    );
  }

  // get pending requests for the authenticated/target user
  @Get('for/:userId')
  async getRequestsForUser(@Param('userId') userId: string) {
    return this.requestService.getRequestsForUser(userId);
  }

  @Patch('confirm')
  async confirmRequest(
    @Body() body: { requestSendUserId: string; requestReceiveUserId: string },
  ) {
    return this.requestService.confirmRequest(
      body.requestSendUserId,
      body.requestReceiveUserId,
    );
  }

  @Patch('reject')
  async rejectRequest(
    @Body() body: { requestSendUserId: string; requestReceiveUserId: string },
  ) {
    return this.requestService.rejectRequest(
      body.requestSendUserId,
      body.requestReceiveUserId,
    );
  }

  @Patch('cancel')
  async cancelRequest(
    @Body() body: { requestSendUserId: string; requestReceiveUserId: string },
  ) {
    return this.requestService.cancelRequest(
      body.requestSendUserId,
      body.requestReceiveUserId,
    );
  }
}
