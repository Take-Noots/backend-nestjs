import { Controller, Get } from '@nestjs/common';
import { RequestService } from './requesr.service';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get('users')
  async getAllUsers() {
    return this.requestService.getAllUsers();
  }
}
