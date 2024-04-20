import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { GendersEnum } from 'src/shared/genders.enum';
import { AutoMap } from '@automapper/classes';
import { PASSWORD_MIN_LENGTH } from '../auth.constant';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

export class SignUpDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: false, enum: GendersEnum })
  @IsEnum(GendersEnum)
  gender: GendersEnum | null;

  @ApiProperty({ required: false })
  phoneNumber: string | null;

  @ApiProperty({ required: false, format: 'YYYY-MM-DD' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: `Date of birth must be in 'YYYY-MM-DD' format` })
  dateOfBirth: Date | null;
}

export class UserInHeaderResponseDto {
  @AutoMap()
  id: number;

  @AutoMap()
  email: string;

  @AutoMap()
  roleId: string;

  @AutoMap()
  phoneNumber: string;
}
