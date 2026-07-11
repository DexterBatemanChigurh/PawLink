import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function imageFilter(_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato não permitido. Use: jpg, png, gif, webp'), false);
  }
}

function createStorage(subfolder: string) {
  return diskStorage({
    destination: join(__dirname, '..', '..', '..', 'uploads', subfolder),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + extname(file.originalname));
    },
  });
}

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('posts'),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload de imagem para post' })
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    return { url: `/uploads/posts/${file.filename}` };
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('avatars'),
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload de avatar' })
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    return { url: `/uploads/avatars/${file.filename}` };
  }

  @Post('cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('covers'),
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload de foto de capa' })
  uploadCover(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    return { url: `/uploads/covers/${file.filename}` };
  }
}
