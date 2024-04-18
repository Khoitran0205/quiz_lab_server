import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  LoginDto,
  SignUpDto,
  UserInHeaderResponseDto,
} from 'src/auth/dto/auth.dto';
import { Users } from 'src/entities/Users';
import { IsNull, Repository } from 'typeorm';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { mapper } from 'src/config/mapper';
import { Roles } from 'src/entities/Roles';
import { RolesEnum } from 'src/shared/roles.enum';

const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Roles)
    private rolesRepository: Repository<Roles>,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const { email, password } = dto;
    if (!email || !password)
      throw new HttpException(
        'Email or password cannot be empty',
        HttpStatus.BAD_REQUEST,
      );

    const existedUser = await this.usersRepository.findOne({
      where: {
        email,
        deletedAt: IsNull(),
      },
      select: ['id', 'email', 'password'],
    });

    if (!existedUser)
      throw new HttpException(
        'Email or password is not correct',
        HttpStatus.BAD_REQUEST,
      );

    const { password: hashedPassword } = existedUser;
    const compareResult = await bcrypt.compare(password, hashedPassword);

    if (!compareResult)
      throw new HttpException(
        'Email or password is not correct',
        HttpStatus.BAD_REQUEST,
      );

    const accessToken = await this.getAccesstoken(existedUser);
    return accessToken;
  }

  async getAccesstoken(user: Users) {
    const expiresIn = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    );

    const accessToken = await this.jwtService.signAsync(
      { user: mapper.map(user, Users, UserInHeaderResponseDto) },
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: `${expiresIn}`,
      },
    );

    return accessToken;
  }

  async signUp(dto: SignUpDto) {
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      phoneNumber,
      address,
      dateOfBirth,
    } = dto;

    if (!email || !password || !firstName || !lastName)
      throw new HttpException(
        'Email or password or first name or last name cannot be empty',
        HttpStatus.BAD_REQUEST,
      );

    if (password.length < 8)
      throw new HttpException(
        'Password must be at least 8 characters',
        HttpStatus.BAD_REQUEST,
      );

    const exitedUser = await this.usersRepository.findOne({
      where: {
        email,
        deletedAt: IsNull(),
      },
    });

    if (exitedUser)
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);

    const hashedPassword = await bcrypt.hash(password, 12);

    const existedRole = await this.rolesRepository.findOne({
      where: {
        name: RolesEnum.MEMBER,
        deletedAt: IsNull(),
      },
    });
    if (!existedRole)
      throw new HttpException('Role not found', HttpStatus.BAD_REQUEST);

    const newUser = await this.usersRepository.save(
      this.usersRepository.create({
        ...dto,
        roleId: existedRole.id,
        password: hashedPassword,
        createdAt: moment().format(),
      }),
    );
    return newUser;
  }
}
