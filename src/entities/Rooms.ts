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
import { Quizzes } from './Quizzes';
import { UserRooms } from './UserRooms';

@Index('rooms_pkey', ['id'], { unique: true })
@Entity('rooms', { schema: 'public' })
export class Rooms {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @AutoMap()
  @Column('bigint', { name: 'quiz_id', nullable: true })
  quizId: string | null;

  @Column('character varying', {
    name: 'code',
    nullable: true,
    length: 255,
  })
  code: string | null;

  @Column('boolean', {
    name: 'is_active',
    nullable: true,
    default: () => 'false',
  })
  isActive: boolean | null;

  @Column('timestamp without time zone', {
    name: 'finished_at',
    nullable: true,
  })
  finishedAt: Date | null;

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

  @ManyToOne(() => Quizzes, (quizzes) => quizzes.rooms)
  @JoinColumn([{ name: 'quiz_id', referencedColumnName: 'id' }])
  quiz: Quizzes;

  @OneToMany(() => UserRooms, (userRooms) => userRooms.room)
  userRooms: UserRooms[];
}
