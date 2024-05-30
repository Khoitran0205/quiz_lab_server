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
  UpdateQuestionDto,
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
      const existedQuiz = await this.validateExistedQuiz(id, updatedBy, false);
      const { coverPicture: existedCoverPicture } = existedQuiz;

      const updatedQuiz = await this.dataSource.transaction(
        async (entityManager) => {
          const {
            title,
            description,
            coverPicture,
            isDeleteCoverPicture,
            questions,
            updatedQuestions,
            deletedQuestionIds,
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

          await this.updateQuestionsAndOptionsForQuiz(
            entityManager,
            id,
            questions,
            updatedQuestions,
            deletedQuestionIds,
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

  async validateExistedQuiz(
    quizId: string,
    userId: string,
    isGettingQuestions: boolean,
  ) {
    const existedQuiz = await this.quizzesRepository.findOne({
      where: {
        id: quizId,
        deletedAt: IsNull(),
      },
      relations: isGettingQuestions?.toString() === 'true' ? ['questions'] : [],
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
    updatedQuestions: UpdateQuestionDto[],
    deletedQuestionIds: string[],
  ) {
    if (deletedQuestionIds?.length > 0)
      await this.deleteQuestionsAndOptionsByQuestionIds(
        entityManager,
        deletedQuestionIds,
      );

    if (questions?.length > 0)
      await this.createQuestionsAndOptionsForQuiz(
        entityManager,
        quizId,
        questions,
      );

    if (updatedQuestions?.length > 0)
      await this.updateExistedQuestionsAndOptions(
        entityManager,
        updatedQuestions,
      );
  }

  async updateExistedQuestionsAndOptions(
    entityManager: EntityManager,
    updatedQuestions: UpdateQuestionDto[],
  ) {
    const preparedUpdatedQuestions = [];
    const prepareDeletedUrl = [];

    for (let i = 0; i < updatedQuestions?.length; i++) {
      const updatedQuestion = updatedQuestions[i];
      const { id, options, mediaUrl, explanationMediaUrl } = updatedQuestion;
      const existedQuestion = await entityManager.findOne(Questions, {
        where: {
          id,
        },
      });

      if (!existedQuestion)
        throw new HttpException('question not found', HttpStatus.BAD_REQUEST);

      const {
        mediaUrl: existedMediaUrl,
        explanationMediaUrl: existedExplanationMediaUrl,
      } = existedQuestion;

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

      if (newMediaUrl) {
        if (existedMediaUrl) prepareDeletedUrl.push(existedMediaUrl);
      }

      if (newExplanationMediaUrl) {
        if (existedExplanationMediaUrl)
          prepareDeletedUrl.push(existedExplanationMediaUrl);
      }

      preparedUpdatedQuestions.push({
        ...updatedQuestion,
        ...(mediaUrl ? { mediaUrl: newMediaUrl } : {}),
        ...(explanationMediaUrl
          ? { explanationMediaUrl: newExplanationMediaUrl }
          : {}),
      });

      if (options) {
        await this.validateOptions(options);
        await entityManager.delete(Options, { questionId: id });
        await entityManager.insert(Options, options);
      }
    }
    await entityManager.save(Questions, preparedUpdatedQuestions);
    await this.cloudinaryService.deletePicture(prepareDeletedUrl);
  }

  async deleteQuestionsAndOptionsByQuestionIds(
    entityManager: EntityManager,
    deletedQuestionIds: string[],
  ) {
    const existedQuestions = await this.questionsRepository.find({
      where: {
        id: In(deletedQuestionIds),
      },
    });

    const prepareDeletedUrl = [];
    for (let i = 0; i < existedQuestions?.length; i++) {
      const question = existedQuestions[i];
      const { mediaUrl, explanationMediaUrl } = question;
      if (mediaUrl) prepareDeletedUrl.push(mediaUrl);

      if (explanationMediaUrl) prepareDeletedUrl.push(explanationMediaUrl);
    }

    await entityManager.delete(Options, { questionId: In(deletedQuestionIds) });
    await entityManager.delete(Questions, { id: In(deletedQuestionIds) });

    if (prepareDeletedUrl?.length > 0)
      await this.cloudinaryService.deletePicture(prepareDeletedUrl);
  }

  async remove(id: string, deletedBy: string) {
    try {
      const existedQuiz = await this.validateExistedQuiz(id, deletedBy, true);
      const { coverPicture, questions } = existedQuiz;

      const preparedDeletedUrl = [];
      if (coverPicture) preparedDeletedUrl.push(coverPicture);
      questions?.map((question) => {
        const { mediaUrl, explanationMediaUrl } = question;

        if (mediaUrl) preparedDeletedUrl.push(mediaUrl);
        if (explanationMediaUrl) preparedDeletedUrl.push(explanationMediaUrl);
      });

      const deletedQuiz = await this.quizzesRepository.save({
        ...existedQuiz,
        deletedAt: moment().format(),
        deletedBy,
      });

      if (preparedDeletedUrl?.length > 0)
        await this.cloudinaryService.deletePicture(preparedDeletedUrl);

      return deletedQuiz;
    } catch (error) {
      throw new HttpException(
        `Failed to delete quiz - ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findQuestionsByQuizId(quizId: string, dto: QuestionFilter) {
    const { page, take } = dto;
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

  async findQuestionsById(questionId: string) {
    const existedQuestion = await this.questionsRepository
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.options', 'options')
      .where(
        `
        q.quizId is not null
        ${questionId ? ' and q.id = :questionId' : ''}
        `,
        {
          ...(questionId ? { questionId } : {}),
        },
      )
      .getOne();

    return existedQuestion;
  }
}
