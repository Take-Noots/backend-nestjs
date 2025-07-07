import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SearchService {
  private data: any[];

  constructor() {
    const filePath = path.join(process.cwd(), 'src', 'search', 'search-data.json');
    this.data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  search(query: string) {
    if (!query) return [];
    return this.data.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}
