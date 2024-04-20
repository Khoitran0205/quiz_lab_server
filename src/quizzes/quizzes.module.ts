import { Module } from '@nestjs/common';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from 'src/services/quizzes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quizzes } from 'src/entities/Quizzes';
import { Questions } from 'src/entities/Questions';
import { Options } from 'src/entities/Options';
import { CloudinaryService } from 'src/utils/cloudinary';

@Module({
  imports: [TypeOrmModule.forFeature([Quizzes, Questions, Options])],
  controllers: [QuizzesController],
  providers: [QuizzesService, CloudinaryService],
})
export class QuizzesModule {}
