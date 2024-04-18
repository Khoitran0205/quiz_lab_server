import { createMap, MappingProfile } from '@automapper/core';
import { Users } from '../entities/Users';
import { UserInHeaderResponseDto } from './dto/auth.dto';

export const authProfile: MappingProfile = (mapper) => {
  createMap(mapper, Users, UserInHeaderResponseDto);
};
