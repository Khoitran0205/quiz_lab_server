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
import { Questions } from './Questions';
import { UserAnswers } from './UserAnswers';

@Index('options_pkey', ['id'], { unique: true })
@Entity('options', { schema: 'public' })
export class Options {
  @AutoMap()
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: string;

  @AutoMap()
  @Column('bigint', { name: 'question_id', nullable: true })
  questionId: string | null;

  @Column('text', { name: 'content', nullable: true })
  content: string | null;

  @Column('boolean', {
    name: 'is_correct',
    nullable: true,
    default: () => 'false',
  })
  isCorrect: boolean | null;

  @ManyToOne(() => Questions, (questions) => questions.options)
  @JoinColumn([{ name: 'question_id', referencedColumnName: 'id' }])
  question: Questions;

  @OneToMany(() => UserAnswers, (userAnswers) => userAnswers.option)
  userAnswers: UserAnswers[];
}
