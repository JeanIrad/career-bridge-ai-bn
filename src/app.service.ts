import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { app: string } {
    return {
      app: 'CareerBridgeAI - AI-Powered Career Guidance',
    };
  }
}
