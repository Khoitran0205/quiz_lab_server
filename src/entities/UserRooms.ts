import { AutoMap } from '@automapper/classes';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './Users';
import { Rooms } from './Rooms';
import { UserAnswers } from './UserAnswers';

@Index('user_rooms_pkey', ['id'], { unique: true })
@Entity('user_rooms', { schema: 'public' })
export class UserRooms {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @AutoMap()
  @Column('bigint', { name: 'user_id', nullable: true })
  userId: string | null;

  @AutoMap()
  @Column('bigint', { name: 'room_id', nullable: true })
  roomId: string | null;

  @Column('bigint', { name: 'total_score', nullable: true })
  totalScore: number | null;

  @Column('bigint', { name: 'total_correct_answer', nullable: true })
  totalCorrectAnswer: number | null;

  @Column('bigint', { name: 'rank', nullable: true })
  rank: number | null;

  @ManyToOne(() => Users, (users) => users.userRooms)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: Users;

  @ManyToOne(() => Rooms, (rooms) => rooms.userRooms)
  @JoinColumn([{ name: 'room_id', referencedColumnName: 'id' }])
  room: Rooms;

  @OneToMany(() => UserAnswers, (userAnswers) => userAnswers.userRoom)
  userAnswers: UserAnswers[];
}
