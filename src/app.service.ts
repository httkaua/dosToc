import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  homePage(): string {
    return 'welcome to Dostoc: A brazilian system for real estate companies and agents';
  }

}