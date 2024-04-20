import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadQuizCoverPicture(base64: string) {
    try {
      return await cloudinary.uploader.upload(base64, {
        resource_type: 'image',
        upload_preset: 'quiz_setups',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async uploadQuestionMedia(base64: string) {
    try {
      return await cloudinary.uploader.upload(base64, {
        resource_type: 'image',
        upload_preset: 'question_setups',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async uploadExplanationMedia(base64: string) {
    try {
      return await cloudinary.uploader.upload(base64, {
        resource_type: 'image',
        upload_preset: 'explanation_setups',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async deletePicture(data: string[]) {
    try {
      await cloudinary.api.delete_resources(data);
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
