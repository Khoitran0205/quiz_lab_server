import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
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
  address: string | null;

  @ApiProperty({ required: false })
  dateOfBirth: string | null;
}

export class ChangePasswordDto {
  @ApiProperty({ required: false })
  oldPassword: string | null;

  @ApiProperty({ required: false })
  newPassword: string | null;
}
