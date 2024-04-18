import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { GendersEnum } from 'src/shared/genders.enum';
import { AutoMap } from '@automapper/classes';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}

export class SignUpDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ required: false, enum: GendersEnum })
  gender: GendersEnum | null;

  @ApiProperty({ required: false })
  phoneNumber: string | null;

  @ApiProperty({ required: false })
  address: string | null;

  @ApiProperty({ required: false })
  dateOfBirth: string | null;
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
