import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from './constants';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    const secret = configService.get<string>('SECRET');

    if (!secret) {
      throw new InternalServerErrorException('JWT secret is not defined in environment variables')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findOne(payload.sub)
    if (!user.userID || !user.email) {
      this.logger.warn(`Invalid attempt to validate JWT, user not found: ${JSON.stringify({...user})}`, 'Jwt Strategy');
      throw new UnauthorizedException('User not found')
    }
    const validatedUser = {
      userID: user.userID,
      username: user.searchableName,
      email: user.email,
      company: user.userCompany,
      role: user.userClassification
    }

    return validatedUser;
  }
}
