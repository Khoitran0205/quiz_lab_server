import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UsersService } from 'src/services/users.service';
import { ChangePasswordDto, UpdateUserDto, UserFilter } from './dto/users.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  async findAll(@Query() input: UserFilter) {
    return await this.usersService.findAll(input);
  }

  @Get('users/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Get('my-info')
  async findOne(@Req() req) {
    const { id: userId } = req.user;
    return await this.usersService.findOne(userId);
  }

  @Patch('my-info')
  async update(@Req() req, @Body() dto: UpdateUserDto) {
    const { id: userId } = req.user;
    const data = await this.usersService.update(userId, dto);
    return {
      message: 'update successfully',
      data,
    };
  }

  @Patch('change-password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    const { id: userId } = req.user;
    const data = await this.usersService.changePassword(userId, dto);
    return {
      message: 'change password successfully',
      data,
    };
  }
}
