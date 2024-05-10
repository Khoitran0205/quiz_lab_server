import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as moment from 'moment';
import { Users } from 'src/entities/Users';
import { ChangePasswordDto, UpdateUserDto } from 'src/users/dto/users.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from 'src/utils/cloudinary';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
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
}
