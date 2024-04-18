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
import { Options } from './Options';

@Index('questions_pkey', ['id'], { unique: true })
@Entity('questions', { schema: 'public' })
export class Questions {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @AutoMap()
  @Column('bigint', { name: 'quiz_id', nullable: true })
  quizId: string | null;

  @Column('text', { name: 'content', nullable: true })
  content: string | null;

  @Column('bigint', {
    name: 'order',
    nullable: true,
  })
  order: number | null;

  @Column('text', {
    name: 'media_url',
    nullable: true,
  })
  mediaUrl: string | null;

  @Column('text', { name: 'explaination_content', nullable: true })
  explainationContent: string | null;

  @Column('text', {
    name: 'explaination_media_url',
    nullable: true,
  })
  explainationMediaUrl: string | null;

  @ManyToOne(() => Quizzes, (quizzes) => quizzes.questions)
  @JoinColumn([{ name: 'quiz_id', referencedColumnName: 'id' }])
  quiz: Quizzes;

  @OneToMany(() => Options, (options) => options.question)
  options: Options[];
}
