import { AutoMap } from '@automapper/classes';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRooms } from './UserRooms';

@Index('users_pkey', ['id'], { unique: true })
@Entity('users', { schema: 'public' })
export class Users {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @AutoMap()
  @Column('character varying', { name: 'email', nullable: true, length: 100 })
  email: string | null;

  @Column('character varying', {
    name: 'password',
    nullable: true,
    length: 255,
    select: false,
  })
  password: string | null;

  @Column('character varying', {
    name: 'first_name',
    nullable: true,
    length: 255,
  })
  firstName: string | null;

  @Column('character varying', {
    name: 'last_name',
    nullable: true,
    length: 255,
  })
  lastName: string | null;

  @Column('character varying', {
    name: 'gender',
    nullable: true,
    length: 255,
  })
  gender: string | null;

  @AutoMap()
  @Column('text', { name: 'profile_picture', nullable: true })
  profilePicture: string | null;

  @AutoMap()
  @Column('character varying', {
    name: 'phone_number',
    nullable: true,
    length: 255,
  })
  phoneNumber: string | null;

  @AutoMap()
  @Column('date', { name: 'date_of_birth', nullable: true })
  dateOfBirth: Date | null;

  @Column('timestamp without time zone', { name: 'created_at', nullable: true })
  createdAt: Date | null;

  @Column('bigint', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @Column('timestamp without time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @Column('bigint', { name: 'updated_by', nullable: true })
  updatedBy: string | null;

  @Column('timestamp without time zone', { name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column('bigint', { name: 'deleted_by', nullable: true })
  deletedBy: string | null;

  @OneToMany(() => UserRooms, (userRooms) => userRooms.user)
  userRooms: UserRooms[];
}
