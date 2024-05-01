import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  CreateQuizDto,
  QuestionFilter,
  QuizFilter,
  UpdateQuizDto,
} from './dto/quizzes.dto';
import { QuizzesService } from 'src/services/quizzes.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@ApiTags('quizzes')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @ApiOperation({ summary: 'Create new quiz' })
  @Post()
  async create(@Req() req, @Body() dto: CreateQuizDto) {
    const { id: createdBy } = req?.user;
    const data = await this.quizzesService.create(dto, createdBy);
    return {
      message: 'create successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get all quizzes' })
  @Get()
  async findAll(@Query() dto: QuizFilter) {
    const data = await this.quizzesService.findAll(dto);
    return {
      message: 'get successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get one detailed quiz' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.quizzesService.findOne(id);
    return {
      message: 'get successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Update quiz by id' })
  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    const { id: updatedBy } = req?.user;
    const data = await this.quizzesService.update(id, updateQuizDto, updatedBy);
    return {
      message: 'update successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Delete quiz by id' })
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const { id: deletedBy } = req?.user;
    const data = await this.quizzesService.remove(id, deletedBy);
    return {
      message: 'delete successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get questions by quiz id' })
  @Get('get-questions/:id')
  async findQuestionsByQuizId(@Query() dto: QuestionFilter) {
    const data = await this.quizzesService.findQuestionsByQuizId(dto);
    return {
      message: 'get successfully',
      data,
    };
  }
}
