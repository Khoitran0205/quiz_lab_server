import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Options } from 'src/entities/Options';
import { Questions } from 'src/entities/Questions';
import { Quizzes } from 'src/entities/Quizzes';
import { CreateQuizDto, QuizFilter } from 'src/quizzes/dto/quizzes.dto';
import {
  PageMetaDto,
  PaginationDto,
  getSkip,
} from 'src/shared/pagination/pagination.dto';
import { CloudinaryService } from 'src/utils/cloudinary';
import { EntityManager, IsNull, Repository } from 'typeorm';

@Injectable()
export class QuizzesService {
  constructor(
    private dataSource: EntityManager,
    @InjectRepository(Quizzes)
    private quizzesRepository: Repository<Quizzes>,
    @InjectRepository(Questions)
    private questionsRepository: Repository<Questions>,
    @InjectRepository(Options)
    private optionsRepository: Repository<Options>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateQuizDto, createdBy: string) {
    try {
      const newQuiz = await this.dataSource.transaction(
        async (entityManager) => {
          const { questions, coverPicture } = dto;

          const newCoverPicture = coverPicture
            ? (
                await this.cloudinaryService.uploadQuizCoverPicture(
                  coverPicture,
                )
              )?.url
            : null;

          const newQuiz = await entityManager.save(
            Quizzes,
            entityManager.create(Quizzes, {
              ...dto,
              coverPicture: newCoverPicture,
              createdBy,
            }),
          );

          const { id: quizId } = newQuiz;

          for (let i = 0; i < questions?.length; i++) {
            const question = questions[i];
            const { options, mediaUrl, explanationMediaUrl } = question;

            const newMediaUrl = mediaUrl
              ? (await this.cloudinaryService.uploadQuestionMedia(mediaUrl))
                  ?.url
              : null;

            const newExplanationMediaUrl = explanationMediaUrl
              ? (
                  await this.cloudinaryService.uploadExplanationMedia(
                    explanationMediaUrl,
                  )
                )?.url
              : null;

            const { id: questionId } = await entityManager.save(
              Questions,
              entityManager.create(Questions, {
                ...question,
                quizId,
                mediaUrl: newMediaUrl,
                explanationMediaUrl: newExplanationMediaUrl,
              }),
            );

            await this.validateOptions(options);
            const preparedOptions = options?.map((option) => {
              return entityManager.create(Options, {
                ...option,
                questionId,
              });
            });

            await entityManager.insert(Options, preparedOptions);
          }

          return newQuiz;
        },
      );

      return newQuiz;
    } catch (error) {
      throw new HttpException(
        `Failed to create quizz - ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async validateOptions(options: any[]) {
    let isHasCorrectOption = false;
    options?.map((option) => {
      const { isCorrect } = option;
      if (isCorrect?.toString() === 'true') isHasCorrectOption = true;
    });

    if (!isHasCorrectOption)
      throw new HttpException(
        'a question must have at least one correct answer',
        HttpStatus.BAD_REQUEST,
      );
  }

  async findAll(dto: QuizFilter) {
    const { page, take, userId } = dto;
    const [quizzes, count] = await this.quizzesRepository
      .createQueryBuilder('q')
      .where(
        `
        q.deletedAt is null
        ${userId ? ' and q.createdBy = :userId' : ''}
        `,
        {
          ...(userId ? { userId } : {}),
        },
      )
      .orderBy('q.id', 'DESC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    return new PaginationDto(quizzes, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }

  async findOne(id: string) {
    const quiz = await this.quizzesRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .where(
        `
        q.deletedAt is null
        ${id ? ' and q.id = :quizId' : ''}
        `,
        {
          ...(id ? { quizId: id } : {}),
        },
      )
      .orderBy({
        'questions.sortOrder': 'ASC',
      })
      .getOne();

    if (!quiz)
      throw new HttpException('quiz not found', HttpStatus.BAD_REQUEST);

    return quiz;
  }
}
