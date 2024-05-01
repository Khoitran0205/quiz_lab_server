import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Options } from 'src/entities/Options';
import { Questions } from 'src/entities/Questions';
import { Quizzes } from 'src/entities/Quizzes';
import {
  CreateQuestionDto,
  CreateQuizDto,
  QuestionFilter,
  QuizFilter,
  UpdateQuizDto,
} from 'src/quizzes/dto/quizzes.dto';
import {
  PageMetaDto,
  PaginationDto,
  getSkip,
} from 'src/shared/pagination/pagination.dto';
import { CloudinaryService } from 'src/utils/cloudinary';
import { EntityManager, In, IsNull, Repository } from 'typeorm';

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

          await this.createQuestionsAndOptionsForQuiz(
            entityManager,
            quizId,
            questions,
          );

          return newQuiz;
        },
      );

      return newQuiz;
    } catch (error) {
      throw new HttpException(
        `Failed to create quiz - ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createQuestionsAndOptionsForQuiz(
    entityManager: EntityManager,
    quizId: string,
    questions: CreateQuestionDto[],
  ) {
    for (let i = 0; i < questions?.length; i++) {
      const question = questions[i];
      const { options, mediaUrl, explanationMediaUrl } = question;

      const newMediaUrl = mediaUrl
        ? (await this.cloudinaryService.uploadQuestionMedia(mediaUrl))?.url
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

  async update(id: string, dto: UpdateQuizDto, updatedBy: string) {
    try {
      const existedQuiz = await this.validateExistedQuiz(id, updatedBy);
      const { coverPicture: existedCoverPicture, questions: existedQuestions } =
        existedQuiz;

      const updatedQuiz = await this.dataSource.transaction(
        async (entityManager) => {
          const {
            title,
            description,
            coverPicture,
            isDeleteCoverPicture,
            questions,
          } = dto;

          if (
            (isDeleteCoverPicture?.toString() === 'true' || coverPicture) &&
            existedCoverPicture
          )
            await this.cloudinaryService.deletePicture(existedCoverPicture);

          const newCoverPicture = coverPicture
            ? (
                await this.cloudinaryService.uploadQuizCoverPicture(
                  coverPicture,
                )
              )?.url
            : isDeleteCoverPicture?.toString() === 'true'
            ? null
            : existedCoverPicture;

          const updatedQuiz = await entityManager.save(Quizzes, {
            ...existedQuiz,
            title,
            description,
            coverPicture: newCoverPicture,
            updatedAt: moment().format(),
            updatedBy,
          });

          if (questions)
            await this.updateQuestionsAndOptionsForQuiz(
              entityManager,
              id,
              questions,
              existedQuestions,
            );

          return updatedQuiz;
        },
      );

      return updatedQuiz;
    } catch (error) {
      throw new HttpException(
        `Failed to update quiz - ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async validateExistedQuiz(quizId: string, userId: string) {
    const existedQuiz = await this.quizzesRepository.findOne({
      where: {
        id: quizId,
        deletedAt: IsNull(),
      },
      relations: ['questions'],
    });

    if (!existedQuiz)
      throw new HttpException('quiz not found', HttpStatus.BAD_REQUEST);

    const { createdBy } = existedQuiz;
    if (userId !== createdBy)
      throw new HttpException('unauthorized', HttpStatus.BAD_REQUEST);

    return existedQuiz;
  }

  async updateQuestionsAndOptionsForQuiz(
    entityManager: EntityManager,
    quizId: string,
    questions: CreateQuestionDto[],
    existedQuestions: Questions[],
  ) {
    await this.deleteQuestionsAndOptionsByQuizId(
      entityManager,
      quizId,
      existedQuestions,
    );

    await this.createQuestionsAndOptionsForQuiz(
      entityManager,
      quizId,
      questions,
    );
  }

  async deleteQuestionsAndOptionsByQuizId(
    entityManager: EntityManager,
    quizId: string,
    existedQuestions: Questions[],
  ) {
    const prepareDeletedUrl = [];
    const listQuestionId = [];
    for (let i = 0; i < existedQuestions?.length; i++) {
      const question = existedQuestions[i];
      const { id, mediaUrl, explanationMediaUrl } = question;
      if (mediaUrl) prepareDeletedUrl.push(mediaUrl);

      if (explanationMediaUrl) prepareDeletedUrl.push(explanationMediaUrl);

      listQuestionId.push(id);
    }

    await entityManager.delete(Options, { questionId: In(listQuestionId) });
    await entityManager.delete(Questions, { quizId });

    await this.cloudinaryService.deletePicture(prepareDeletedUrl);
  }

  async remove(id: string, deletedBy: string) {
    try {
      const existedQuiz = await this.validateExistedQuiz(id, deletedBy);
      return await this.quizzesRepository.save({
        ...existedQuiz,
        deletedAt: moment().format(),
        deletedBy,
      });
    } catch (error) {
      throw new HttpException(
        `Failed to delete quiz - ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findQuestionsByQuizId(dto: QuestionFilter) {
    const { page, take, quizId } = dto;
    const [questions, count] = await this.questionsRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'options')
      .where(
        `
        q.quizId is not null
        ${quizId ? ' and q.quizId = :quizId' : ''}
        `,
        {
          ...(quizId ? { quizId } : {}),
        },
      )
      .orderBy('q.sortOrder', 'ASC')
      .take(take)
      .skip(getSkip({ page, take }))
      .getManyAndCount();

    return new PaginationDto(questions, <PageMetaDto>{
      page,
      take,
      totalCount: count,
    });
  }
}
