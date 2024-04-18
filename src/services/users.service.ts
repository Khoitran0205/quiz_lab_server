import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as moment from 'moment';
import {
  PageMetaDto,
  PaginationDto,
  getSkip,
} from 'src/shared/pagination/pagination.dto';
import { Users } from 'src/entities/Users';
import {
  ChangePasswordDto,
  UpdateUserDto,
  UserFilter,
} from 'src/users/dto/users.dto';
const bcrypt = require('bcrypt');
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findAll(input: UserFilter) {
    const { page, take } = input;

    const [users, count] = await this.usersRepository
      .createQueryBuilder('u')
      // .leftJoinAndSelect('n.newsPictures', 'newsPictures')
      .where(`u.deletedAt is null and u.roleId = 2`)
      .orderBy('u.id', 'DESC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    return new PaginationDto(users, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }

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
    await this.usersRepository.save({
      ...existedUser,
      ...dto,
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
    const { password: hashedPassword } = existedUser;
    const compareResult = await bcrypt.compare(oldPassword, hashedPassword);

    if (!compareResult)
      throw new HttpException(
        'Old password is not correct',
        HttpStatus.BAD_REQUEST,
      );

    if (newPassword?.length < 8)
      throw new HttpException(
        'New password must be at least 8 characters',
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
}
