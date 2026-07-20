import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('health')
  healthCheck() {
    return this.health.liveness();
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    const body = await this.health.readiness();
    if (body.status !== 'ready') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return body;
  }

  @Get('version')
  version() {
    return this.health.version();
  }
}
