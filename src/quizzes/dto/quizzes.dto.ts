import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MIN_OPTIONS, MIN_QUESTIONS } from '../quizzes.constant';
import { PageOptionsDto } from 'src/shared/pagination/pagination.dto';
import { TimersEnum } from 'src/shared/timers.enum';

export class QuizFilter extends OmitType(PageOptionsDto, ['order'] as const) {
  @ApiProperty({ required: false })
  userId: string | null;
}

export class QuestionFilter extends OmitType(PageOptionsDto, [
  'order',
] as const) {
  @ApiProperty({ required: false })
  @IsNotEmpty()
  quizId: string | null;
}

export class CreateOptionDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  content: string | null;

  @ApiProperty({ required: false, default: false })
  isCorrect: boolean | null;
}

export class CreateQuestionDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  content: string | null;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  sortOrder: number | null;

  @ApiProperty({ required: true, enum: TimersEnum })
  @IsNotEmpty()
  @IsEnum(TimersEnum)
  timer: TimersEnum | null;

  @ApiProperty({ required: false })
  mediaUrl: string | null;

  @ApiProperty({ required: false })
  explanationContent: string | null;

  @ApiProperty({ required: false })
  explanationMediaUrl: string | null;

  @ApiProperty({ required: true, type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(MIN_OPTIONS)
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string | null;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty({ required: false })
  coverPicture: string | null;

  @ApiProperty({ required: true, type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(MIN_QUESTIONS)
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class UpdateQuizDto extends PartialType(CreateQuizDto) {
  @ApiProperty({ required: false })
  title: string | null;

  @ApiProperty({ required: false, default: false })
  isDeleteCoverPicture: boolean | null;
}
