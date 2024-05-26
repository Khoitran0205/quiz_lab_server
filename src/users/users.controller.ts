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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UsersService } from 'src/services/users.service';
import {
  ChangePasswordDto,
  OrganizingHistoryDto,
  PlayingHistoryDto,
  UpdateUserDto,
  UserHistoryDto,
} from './dto/users.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user by id' })
  @Get('users/:id')
  async findOneAdmin(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Get my info' })
  @Get('my-info')
  async findOne(@Req() req) {
    const { id: userId } = req?.user;
    return await this.usersService.findOne(userId);
  }

  @ApiOperation({ summary: 'Update my info' })
  @Patch('my-info')
  async update(@Req() req, @Body() dto: UpdateUserDto) {
    const { id: userId } = req?.user;
    const data = await this.usersService.update(userId, dto);
    return {
      message: 'update successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Change my password' })
  @Patch('change-password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    const { id: userId } = req?.user;
    const data = await this.usersService.changePassword(userId, dto);
    return {
      message: 'change password successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get my histories' })
  @Get('my-history')
  async getMyHistory(@Req() req, @Query() dto: UserHistoryDto) {
    const { id: userId } = req?.user;
    const data = await this.usersService.getMyHistory(dto, userId);
    return {
      message: 'get successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get playing history by user-room id' })
  @Get('my-playing-history')
  async getPlayingHistory(@Req() req, @Query() dto: PlayingHistoryDto) {
    const { id: userId } = req?.user;
    const data = await this.usersService.getPlayingHistory(dto, userId);
    return {
      message: 'get successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get organizing history by room id' })
  @Get('my-organizing-history')
  async getOrganizingHistory(@Req() req, @Query() dto: OrganizingHistoryDto) {
    const { id: userId } = req?.user;
    const data = await this.usersService.getOrganizingHistory(dto, userId);
    return {
      message: 'get successfully',
      data,
    };
  }
}
