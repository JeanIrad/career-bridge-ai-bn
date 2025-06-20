import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { DocumentVerificationController } from './document-verification.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    MulterModule.register({
      dest: './uploads/temp', // Temporary storage before uploading to Cloudinary
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for portfolios
        files: 10, // Maximum 10 files for bulk upload
      },
    }),
  ],
  controllers: [UploadController, DocumentVerificationController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
