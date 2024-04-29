import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  quizId: string | null;
}

export class UserJoinRoomDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString({ message: 'Room code must be in type string' })
  roomCode: string | null;
}
