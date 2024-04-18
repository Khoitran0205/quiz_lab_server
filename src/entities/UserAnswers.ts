import { AutoMap } from '@automapper/classes';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './Users';
import { UserRooms } from './UserRooms';
import { Options } from './Options';

@Index('user_answers_pkey', ['id'], { unique: true })
@Entity('user_answers', { schema: 'public' })
export class UserAnswers {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @AutoMap()
  @Column('bigint', { name: 'user_room_id', nullable: true })
  userRoomId: string | null;

  @AutoMap()
  @Column('bigint', { name: 'option_id', nullable: true })
  optionId: string | null;

  @Column('double precision', {
    name: 'answer_speed',
    nullable: true,
    precision: 53,
  })
  answerSpeed: number | null;

  @Column('bigint', { name: 'score', nullable: true })
  score: number | null;

  @ManyToOne(() => UserRooms, (userRooms) => userRooms.userAnswers)
  @JoinColumn([{ name: 'user_room_id', referencedColumnName: 'id' }])
  userRoom: Users;

  @ManyToOne(() => Options, (options) => options.userAnswers)
  @JoinColumn([{ name: 'option_id', referencedColumnName: 'id' }])
  option: Options;
}
