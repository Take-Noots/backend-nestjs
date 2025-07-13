import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';

@Injectable()
export class SearchService {
  constructor(private readonly userService: UserService) {}

  async search(query: string) {
    if (!query) return [];
    const users = await this.userService.findAllWithPagination({ username: { $regex: query, $options: 'i' } });
    return users.map(user => ({ id: user._id, name: user.username, type: 'user' }));
  }
}
