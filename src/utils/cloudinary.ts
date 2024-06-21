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

  async uploadProfilePicture(base64: string) {
    try {
      return await cloudinary.uploader.upload(base64, {
        resource_type: 'image',
        upload_preset: 'avatar_setups',
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
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

  async deletePicture(data: string[] | string) {
    try {
      if (data?.length > 0) {
        const prepareDeletedUrl = await this.prepareListDeletedUrl(data);
        await cloudinary.api.delete_resources(prepareDeletedUrl);
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async prepareListDeletedUrl(data: string[] | string) {
    return typeof data === 'string'
      ? [data]?.map((url) => {
          const secondToLastSlashIndex = url?.lastIndexOf(
            '/',
            url.lastIndexOf('/') - 1,
          );
          return url
            ?.slice(secondToLastSlashIndex + 1)
            ?.replace(/\.[^/.]+$/, '');
        })
      : data?.map((url) => {
          const secondToLastSlashIndex = url?.lastIndexOf(
            '/',
            url.lastIndexOf('/') - 1,
          );
          return url
            ?.slice(secondToLastSlashIndex + 1)
            ?.replace(/\.[^/.]+$/, '');
        });
  }
}
