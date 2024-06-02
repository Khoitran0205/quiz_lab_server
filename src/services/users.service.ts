import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as moment from 'moment';
import { Users } from 'src/entities/Users';
import {
  ChangePasswordDto,
  OrganizingHistoryDto,
  PlayingHistoryDto,
  UpdateUserDto,
  UserHistoryDto,
} from 'src/users/dto/users.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/utils/cloudinary';
import { HistoriesEnum } from 'src/shared/histories.enum';
import { UserRooms } from 'src/entities/UserRooms';
import {
  PageMetaDto,
  PaginationDto,
  getSkip,
} from 'src/shared/pagination/pagination.dto';
import { Rooms } from 'src/entities/Rooms';
import { Questions } from 'src/entities/Questions';
import { UserAnswers } from 'src/entities/UserAnswers';
import { RoomsService } from './rooms.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Rooms)
    private roomsRepository: Repository<Rooms>,
    @InjectRepository(UserRooms)
    private userRoomsRepository: Repository<UserRooms>,
    @InjectRepository(Questions)
    private questionsRepository: Repository<Questions>,
    @InjectRepository(UserAnswers)
    private userAnswersRepository: Repository<UserAnswers>,
    private readonly roomsService: RoomsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
    if (!user)
      throw new HttpException('user not found', HttpStatus.BAD_REQUEST);

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existedUser = await this.findOne(id);

    const { profilePicture } = dto;

    const newProfilePicture = profilePicture
      ? (await this.cloudinaryService.uploadProfilePicture(profilePicture))?.url
      : null;

    await this.usersRepository.save({
      ...existedUser,
      ...dto,
      ...(profilePicture ? { profilePicture: newProfilePicture } : {}),
      updatedAt: moment().format(),
      updatedBy: id,
    });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const { oldPassword, newPassword } = dto;
    const existedUser = await this.usersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      select: ['password'],
    });
    if (!existedUser)
      throw new HttpException('user not found', HttpStatus.BAD_REQUEST);

    const { password: hashedPassword } = existedUser;
    const compareResult = await bcrypt.compare(oldPassword, hashedPassword);

    if (!compareResult)
      throw new HttpException(
        'Old password is not correct',
        HttpStatus.BAD_REQUEST,
      );

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.usersRepository.update(
      { id },
      {
        password: hashedNewPassword,
        updatedAt: moment().format(),
        updatedBy: id,
      },
    );
  }

  async getMyHistory(dto: UserHistoryDto, userId: string) {
    const { page, take, historyType } = dto;
    switch (historyType) {
      case HistoriesEnum.PLAYING:
        return await this.getUserPlayingHistory(userId, page, take);
      case HistoriesEnum.ORGANIZING:
        return await this.getUserOrganizingHistory(userId, page, take);
    }
  }

  async getUserPlayingHistory(userId: string, page: number, take: number) {
    const [playingHistories, count] = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoinAndSelect('uR.room', 'room')
      .leftJoinAndSelect('room.quiz', 'quiz')
      .where(
        `
        quiz.deletedAt is null
        ${
          userId ? ' and uR.userId = :userId and room.createdBy != :userId' : ''
        }
        `,
        {
          ...(userId ? { userId } : {}),
        },
      )
      .orderBy('room.createdAt', 'DESC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    return new PaginationDto(playingHistories, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }

  async getUserOrganizingHistory(userId: string, page: number, take: number) {
    const [organizingHistories, count] = await this.roomsRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.quiz', 'quiz')
      .where(
        `
        r.deletedAt is null and quiz.deletedAt is null
        ${userId ? ' and r.createdBy = :userId' : ''}
        `,
        {
          ...(userId ? { userId } : {}),
        },
      )
      .orderBy('r.createdAt', 'DESC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    return new PaginationDto(organizingHistories, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }

  async getPlayingHistory(dto: PlayingHistoryDto, userId: string) {
    const { userRoomId } = dto;
    const existedUserRoom = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoinAndSelect('uR.room', 'room')
      .leftJoinAndSelect('room.quiz', 'quiz')
      .where('room.deletedAt is null and uR.id = :userRoomId', {
        userRoomId,
      })
      .getOne();

    const { userId: userRoomUserId, roomId, room } = existedUserRoom;
    const { quizId, createdBy } = room;

    if (!existedUserRoom)
      throw new HttpException(
        'Playing history not found',
        HttpStatus.BAD_REQUEST,
      );

    if (userId !== userRoomUserId)
      throw new HttpException(
        'You are not authorized to view this history',
        HttpStatus.BAD_REQUEST,
      );

    const totalPLayer = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoin('uR.user', 'user')
      .leftJoin('uR.room', 'room')
      .where(
        'user.deletedAt is null and room.deletedAt is null and uR.userId != :createdBy and room.id = :roomId',
        {
          roomId,
          createdBy,
        },
      )
      .getCount();

    const totalQuestion = await this.questionsRepository
      .createQueryBuilder('q')
      .leftJoin('q.quiz', 'quiz')
      .where('quiz.deletedAt is null and q.quizId = :quizId', {
        quizId,
      })
      .getCount();

    const totalCorrectAnswer = await this.userAnswersRepository
      .createQueryBuilder('uA')
      .leftJoin('uA.question', 'question')
      .leftJoin('question.quiz', 'quiz')
      .where('quiz.deletedAt is null and uA.score > 0 and quiz.id = :quizId', {
        quizId,
      })
      .getCount();

    const top3Player = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoinAndSelect('uR.user', 'user')
      .leftJoin('uR.room', 'room')
      .where(
        `
      room.deletedAt is null and uR.rank <= 3 and uR.rank != 0
      and room.id = :roomId
      `,
        {
          ...(roomId ? { roomId } : {}),
        },
      )
      .orderBy('uR.rank', 'ASC')
      .getMany();

    return {
      userRoom: existedUserRoom,
      totalPLayer,
      totalQuestion,
      totalCorrectAnswer,
      top3Player,
    };
  }

  async getOrganizingHistory(dto: OrganizingHistoryDto, userId: string) {
    const { page, take, roomId } = dto;
    const existedRoom = await this.roomsService.findRoomById(roomId);

    if (!existedRoom) {
      throw new HttpException('Room not found', HttpStatus.BAD_REQUEST);
    }

    const [userRooms, count] = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoinAndSelect('uR.user', 'user')
      .leftJoin('uR.room', 'room')
      .where(
        `
        room.deletedAt is null
        ${userId ? ' and room.createdBy = :userId' : ''}
        ${roomId ? ' and uR.roomId = :roomId' : ''}
        `,
        {
          ...(userId ? { userId } : {}),
          ...(roomId ? { roomId } : {}),
        },
      )
      .orderBy('uR.rank', 'ASC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    const { quizId } = existedRoom;

    const totalQuestion = await this.questionsRepository
      .createQueryBuilder('q')
      .leftJoin('q.quiz', 'quiz')
      .where('quiz.deletedAt is null and q.quizId = :quizId', {
        quizId,
      })
      .getCount();

    return new PaginationDto(userRooms, <PageMetaDto>{
      page,
      take,
      totalCount: count,
      totalQuestion,
    });
  }
}
