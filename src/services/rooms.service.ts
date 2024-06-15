import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateRoomDto,
  GetUserAnswerDto,
  UserAnswerQuestionDto,
  UserJoinRoomDto,
  UserRoomFilter,
} from '../rooms/dto/rooms.dto';
import { Rooms } from 'src/entities/Rooms';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizzesService } from './quizzes.service';
import { generateRoomCode } from 'src/shared/utils';
import {
  DEFAULT_RANK,
  DEFAULT_TOTAL_CORRECT_ANSWER,
  DEFAULT_TOTAL_SCORE,
  ROOM_CODE_LENGTH,
} from 'src/rooms/rooms.constant';
import * as moment from 'moment';
import { UserRooms } from 'src/entities/UserRooms';
import { UserAnswers } from 'src/entities/UserAnswers';
import { Questions } from 'src/entities/Questions';
import { MAX_QUESTION_SCORE } from 'src/shared/global.constants';
import {
  PageMetaDto,
  PaginationDto,
  getSkip,
} from 'src/shared/pagination/pagination.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Rooms)
    private roomsRepository: Repository<Rooms>,
    @InjectRepository(UserRooms)
    private userRoomsRepository: Repository<UserRooms>,
    @InjectRepository(UserAnswers)
    private userAnswersRepository: Repository<UserAnswers>,
    @InjectRepository(Questions)
    private questionsRepository: Repository<Questions>,
    private readonly quizzesService: QuizzesService,
  ) {}

  async create(dto: CreateRoomDto, createdBy: string) {
    const { quizId } = dto;
    await this.quizzesService.validateExistedQuiz(quizId, createdBy, false);

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

    const existedUserRoom = await this.checkIfUserHasJoinedRoom(roomId, userId);
    if (existedUserRoom)
      throw new HttpException(
        'user has joined this room',
        HttpStatus.BAD_REQUEST,
      );

    return await this.userRoomsRepository.save(
      this.userRoomsRepository.create({
        userId,
        roomId,
        totalScore: DEFAULT_TOTAL_SCORE,
        totalCorrectAnswer: DEFAULT_TOTAL_CORRECT_ANSWER,
        rank: DEFAULT_RANK,
      }),
    );
  }

  async checkIfUserHasJoinedRoom(roomId: string, userId: string) {
    const existedUserRoom = await this.userRoomsRepository.findOne({
      where: {
        userId,
        roomId,
      },
    });

    return existedUserRoom;
  }

  async answerQuestion(dto: UserAnswerQuestionDto, userId: string) {
    const { roomCode, questionId, optionId, timer } = dto;

    const existedRoom = await this.findRoomByCode(roomCode);
    if (!existedRoom)
      throw new HttpException('room not found', HttpStatus.BAD_REQUEST);

    const { id: roomId } = existedRoom;

    const existedUserRoom = await this.checkIfUserHasJoinedRoom(roomId, userId);
    if (!existedUserRoom)
      throw new HttpException(
        'user has not joined this room',
        HttpStatus.BAD_REQUEST,
      );

    const { id: userRoomId, totalScore, totalCorrectAnswer } = existedUserRoom;

    const { question, option } = await this.validateQuestionAndOption(
      questionId,
      optionId,
    );

    await this.validateUserAnswer(userRoomId, questionId);

    const { timer: questionTimer } = question;
    const { isCorrect } = option;

    const userAnswerScore = await this.calculateUserAnswerScore(
      timer,
      questionTimer,
      isCorrect,
    );

    const newUserAnswer = await this.userAnswersRepository.save(
      this.userAnswersRepository.create({
        userRoomId,
        questionId,
        optionId,
        answerSpeed: timer,
        score: userAnswerScore,
      }),
    );

    await this.userRoomsRepository.save({
      ...existedUserRoom,
      totalScore: totalScore + userAnswerScore,
      totalCorrectAnswer:
        isCorrect?.toString() === 'true'
          ? totalCorrectAnswer + 1
          : totalCorrectAnswer,
    });

    return newUserAnswer;
  }

  async validateUserAnswer(userRoomId: string, questionId: string) {
    const existedUserAnswers = await this.userAnswersRepository.findOne({
      where: {
        userRoomId,
        questionId,
      },
    });
    if (existedUserAnswers)
      throw new HttpException(
        'user has already answered this question',
        HttpStatus.BAD_REQUEST,
      );
  }

  async validateQuestionAndOption(questionId: string, optionId: string) {
    const existedQuestion = await this.questionsRepository.findOne({
      where: {
        id: questionId,
      },
      relations: ['options'],
    });
    if (!existedQuestion)
      throw new HttpException('question not found', HttpStatus.BAD_REQUEST);

    const { options } = existedQuestion;
    const existedOption = options.find((option) => option.id === optionId);
    if (!existedOption)
      throw new HttpException('option not found', HttpStatus.BAD_REQUEST);

    return {
      question: existedQuestion,
      option: existedOption,
    };
  }

  async calculateUserAnswerScore(
    timer: number,
    questionTimer: number,
    isCorrect: boolean,
  ) {
    const score =
      isCorrect.toString() === 'true'
        ? (MAX_QUESTION_SCORE / questionTimer) * (questionTimer - timer)
        : 0;

    return Math.round(score);
  }

  async updateRankOfARoom(roomId: string, userId: string) {
    const existedRoom = await this.findRoomById(roomId);
    if (!existedRoom)
      throw new HttpException('room not found', HttpStatus.BAD_REQUEST);

    const existedUserRooms = await this.userRoomsRepository.find({
      where: {
        roomId,
        userId: Not(userId),
      },
    });

    if (existedUserRooms?.length > 0) {
      existedUserRooms?.sort((a, b) => b.totalScore - a.totalScore);
      const preparedSortedUserRooms = existedUserRooms?.map(
        (userRoom, index) => {
          const rank = index + 1;
          return {
            ...userRoom,
            rank,
          };
        },
      );

      await this.userRoomsRepository.save(preparedSortedUserRooms);

      return await this.getUsers(roomId, {
        page: 1,
        take: 99999,
        skip: 0,
      });
    }

    return {};
  }

  async getUsers(roomId: string, dto: UserRoomFilter) {
    const { page, take } = dto;
    const [userRooms, count] = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoinAndSelect('uR.user', 'user')
      .where(
        `
        uR.userId is not null
        ${roomId ? ' and uR.roomId = :roomId' : ''}
        `,
        {
          ...(roomId ? { roomId } : {}),
        },
      )
      .orderBy('uR.rank', 'ASC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    return new PaginationDto(userRooms, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }

  async getUserAnswers(dto: GetUserAnswerDto) {
    const { roomCode, questionId } = dto;
    const userAnswers = await this.userAnswersRepository
      .createQueryBuilder('uA')
      .leftJoin('uA.userRoom', 'userRoom')
      .leftJoin('userRoom.room', 'room')
      .where(
        `
        uA.questionId is not null
        ${roomCode ? ' and room.code = :roomCode' : ''}
        ${questionId ? ' and uA.questionId = :questionId' : ''}
        `,
        {
          ...(roomCode ? { roomCode } : {}),
          ...(questionId ? { questionId } : {}),
        },
      )
      .orderBy('uA.id', 'DESC')
      .getMany();

    return userAnswers;
  }
}
