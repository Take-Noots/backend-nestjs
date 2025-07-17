import { Controller, Get, Body, Patch } from '@nestjs/common';
import { RequestService } from './requesr.service';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get('pending')
  async getPendingRequests() {
    return this.requestService.getPendingRequests();
  }

  @Patch('confirm')
  async confirmRequest(@Body() body: { requestSendUserId: string, requestReceiveUserId: string }) {
    return this.requestService.confirmRequest(body.requestSendUserId, body.requestReceiveUserId);
  }
}
