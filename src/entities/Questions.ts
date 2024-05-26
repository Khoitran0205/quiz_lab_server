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
import { UserAnswers } from './UserAnswers';

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
    name: 'sort_order',
    nullable: true,
  })
  sortOrder: string | null;

  @Column('bigint', {
    name: 'timer',
    nullable: true,
  })
  timer: number | null;

  @Column('text', {
    name: 'media_url',
    nullable: true,
  })
  mediaUrl: string | null;

  @Column('text', { name: 'explanation_content', nullable: true })
  explanationContent: string | null;

  @Column('text', {
    name: 'explanation_media_url',
    nullable: true,
  })
  explanationMediaUrl: string | null;

  @ManyToOne(() => Quizzes, (quizzes) => quizzes.questions)
  @JoinColumn([{ name: 'quiz_id', referencedColumnName: 'id' }])
  quiz: Quizzes;

  @OneToMany(() => Options, (options) => options.question)
  options: Options[];

  @OneToMany(() => UserAnswers, (userAnswers) => userAnswers.question)
  userAnswers: UserAnswers[];
}
