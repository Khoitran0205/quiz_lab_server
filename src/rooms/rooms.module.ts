import { Module } from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rooms } from 'src/entities/Rooms';

@Module({
  imports: [TypeOrmModule.forFeature([Rooms])],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
