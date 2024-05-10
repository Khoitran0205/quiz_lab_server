import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from 'src/auth/auth.constant';
import { GendersEnum } from 'src/shared/genders.enum';
import { PageOptionsDto } from 'src/shared/pagination/pagination.dto';

export class UserFilter extends OmitType(PageOptionsDto, ['order'] as const) {}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  firstName: string | null;

  @ApiProperty({ required: false })
  lastName: string | null;

  @ApiProperty({ required: false, enum: GendersEnum })
  gender: GendersEnum | null;

  @ApiProperty({ required: false })
  phoneNumber: string | null;

  @ApiProperty({ required: false })
  profilePicture: string | null;

  @ApiProperty({ required: false, format: 'YYYY-MM-DD' })
  @Transform(({ value }) => new Date(value))
  dateOfBirth: Date | null;
}

export class ChangePasswordDto {
  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  oldPassword: string | null;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  newPassword: string | null;
}
