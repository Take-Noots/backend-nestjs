import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class RequestService {
  constructor(private readonly userService: UserService) {}

  async getAllUsers() {
    return this.userService.getAllUsersForDebug();
  }
} 
