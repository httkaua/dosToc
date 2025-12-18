import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,

    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    this.logger.log(`Validating user: ${email}`, 'AuthService');
    const user = await this.usersService.findUserWithPasswordByEmail(email);
    
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    this.logger.warn('User not found or wrong credentials', 'AuthService')
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.userID };

    this.logger.log(`Logging in: ${JSON.stringify(payload)}`, 'AuthService')

    const token = this.jwtService.sign(payload)

    this.logger.log(`User successfully logged in`, 'AuthService');

    return {
      access_token: token
    };
  }
}