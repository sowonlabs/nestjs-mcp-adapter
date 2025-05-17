import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthGuard {
  private logger = new Logger(AuthGuard.name);

  canActivate(context: any): boolean {
    this.logger.debug('AuthGuard: Checking authentication');
    return true;
  }
}
