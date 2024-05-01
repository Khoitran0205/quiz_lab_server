import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateRoomDto,
  UserAnswerQuestionDto,
  UserJoinRoomDto,
} from '../rooms/dto/rooms.dto';
import { Rooms } from 'src/entities/Rooms';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizzesService } from './quizzes.service';
import { generateRoomCode } from 'src/shared/utils';
import {
  DEFAULT_RANK,
  DEFAULT_TOTAL_SCORE,
  ROOM_CODE_LENGTH,
} from 'src/rooms/rooms.constant';
import * as moment from 'moment';
import { UserRooms } from 'src/entities/UserRooms';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Rooms)
    private roomsRepository: Repository<Rooms>,
    @InjectRepository(UserRooms)
    private userRoomsRepository: Repository<UserRooms>,
    private readonly quizzesService: QuizzesService,
  ) {}

  async create(dto: CreateRoomDto, createdBy: string) {
    const { quizId } = dto;
    await this.quizzesService.validateExistedQuiz(quizId, createdBy);

    const code = await this.createConversationCode();

    return await this.roomsRepository.save(
      this.roomsRepository.create({
        quizId,
        code,
        isActive: true,
        createdBy,
      }),
    );
  }

  async createConversationCode() {
    let existedRoom: any = true;
    let prepareRoomCode = '';

    while (existedRoom) {
      prepareRoomCode = generateRoomCode(ROOM_CODE_LENGTH);
      existedRoom = await this.findRoomByCode(prepareRoomCode);
    }

    return prepareRoomCode;
  }

  async findRoomByCode(code: string) {
    return await this.roomsRepository.findOne({
      where: {
        code,
        isActive: true,
        deletedAt: IsNull(),
      },
    });
  }

  async endQuizRoom(id: string, updatedBy: string) {
    const existedRoom = await this.findRoomById(id);
    if (!existedRoom)
      throw new HttpException('room not found', HttpStatus.BAD_REQUEST);

    return await this.roomsRepository.save({
      ...existedRoom,
      isActive: false,
      finishedAt: moment().format(),
      updatedAt: moment().format(),
      updatedBy,
    });
  }

  async findRoomById(id: string) {
    return await this.roomsRepository.findOne({
      where: {
        id,
        isActive: true,
        deletedAt: IsNull(),
      },
    });
  }

  async joinRoom(dto: UserJoinRoomDto, userId: string) {
    const { roomCode } = dto;
    const existedRoom = await this.findRoomByCode(roomCode);
    if (!existedRoom)
      throw new HttpException('room not found', HttpStatus.BAD_REQUEST);

    const { id: roomId } = existedRoom;

    await this.validateUserHasJoinedRoom(roomId, userId);
    return await this.userRoomsRepository.save(
      this.userRoomsRepository.create({
        userId,
        roomId,
        totalScore: DEFAULT_TOTAL_SCORE,
        rank: DEFAULT_RANK,
      }),
    );
  }

  async validateUserHasJoinedRoom(roomId: string, userId: string) {
    const existedUserRoom = await this.userRoomsRepository.findOne({
      where: {
        userId,
        roomId,
      },
    });

    if (existedUserRoom)
      throw new HttpException(
        'user has joined this room',
        HttpStatus.BAD_REQUEST,
      );
  }

  async answerQuestion(dto: UserAnswerQuestionDto, userId: string) {}

  // findAll() {}

  // findOne() {}

  // update() {}

  // remove() {}
}
