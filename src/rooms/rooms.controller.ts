import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import {
  CreateRoomDto,
  UserAnswerQuestionDto,
  UserJoinRoomDto,
} from './dto/rooms.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'Create new room' })
  @Post()
  async create(@Req() req, @Body() dto: CreateRoomDto) {
    const { id: createdBy } = req?.user;
    const data = await this.roomsService.create(dto, createdBy);
    return {
      message: 'create successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'User joins room' })
  @Post()
  async joinRoom(@Req() req, @Body() dto: UserJoinRoomDto) {
    const { id: userId } = req?.user;
    const data = await this.roomsService.joinRoom(dto, userId);
    return {
      message: 'join successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'User answers question' })
  @Post()
  async answerQuestion(@Req() req, @Body() dto: UserAnswerQuestionDto) {
    const { id: userId } = req?.user;
    const data = await this.roomsService.answerQuestion(dto, userId);
    return {
      message: 'answer successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'End quiz room' })
  @Patch('end-room/:id')
  async endQuizRoom(@Req() req, @Param('id') id: string) {
    const { id: updatedBy } = req?.user;
    const data = await this.roomsService.endQuizRoom(id, updatedBy);
    return {
      message: 'update successfully',
      data,
    };
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.roomsService.remove(+id);
  // }
}
