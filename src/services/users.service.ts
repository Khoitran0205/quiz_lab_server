import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as moment from 'moment';
import { Users } from 'src/entities/Users';
import {
  ChangePasswordDto,
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
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(UserRooms)
    private userRoomsRepository: Repository<UserRooms>,
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

  async getMyHistory(userId: string, dto: UserHistoryDto) {
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
        ${userId ? ' and uR.userId = :userId' : ''}
        `,
        {
          ...(userId ? { userId } : {}),
        },
      )
      .addSelect(
        `
        (SELECT COUNT(*) FROM user_rooms uR2
        WHERE uR2.room_id = uR.id)
      `,
        'totalPlayer',
      )
      .orderBy('room.createdAt', 'DESC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getRawMany();

    return new PaginationDto(playingHistories, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }

  async getUserOrganizingHistory(userId: string, page: number, take: number) {
    const [playingHistories, count] = await this.userRoomsRepository
      .createQueryBuilder('uR')
      .leftJoinAndSelect('uR.room', 'room')
      .leftJoinAndSelect('room.quiz', 'quiz')
      .where(
        `
        quiz.deleted is null
        ${userId ? ' and uR.userId = :userId' : ''}
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
}
