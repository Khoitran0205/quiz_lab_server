import { AutoMap } from '@automapper/classes';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Questions } from './Questions';
import { Rooms } from './Rooms';

@Index('quizzes_pkey', ['id'], { unique: true })
@Entity('quizzes', { schema: 'public' })
export class Quizzes {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column('character varying', { name: 'title', nullable: true, length: 255 })
  title: string | null;

  @Column('character varying', {
    name: 'description',
    nullable: true,
    length: 1000,
  })
  description: string | null;

  @Column('text', {
    name: 'cover_picture',
    nullable: true,
  })
  coverPicture: string | null;

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

  @OneToMany(() => Questions, (questions) => questions.quiz)
  questions: Questions[];

  @OneToMany(() => Rooms, (rooms) => rooms.quiz)
  rooms: Rooms[];
}
