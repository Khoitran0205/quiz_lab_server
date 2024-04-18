import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from 'src/services/auth.service';
import { LoginDto, SignUpDto } from './dto/auth.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const accessToken = await this.authService.login(dto);
    return {
      message: 'login successfully',
      accessToken,
    };
  }

  @Post('sign-up')
  async signUp(@Body() dto: SignUpDto) {
    const newUser = await this.authService.signUp(dto);
    return {
      message: 'sign up successfully',
      newUser,
    };
  }
}
