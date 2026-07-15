import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Pet } from './entities/pet.entity';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function imageFilter(_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato não permitido. Use: jpg, png, gif, webp'), false);
  }
}

@ApiTags('Pets')
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post('upload-photos')
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'uploads', 'pets'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload de fotos para pets' })
  uploadPhotos(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) throw new BadRequestException('Nenhum arquivo enviado');
    return files.map((f) => `/uploads/pets/${f.filename}`);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cadastrar novo pet' })
  create(@Body() dto: CreatePetDto, @CurrentUser() user: User): Promise<Pet> {
    return this.petsService.create(dto, user.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar pets com filtros' })
  findAll(
    @Query('species') species?: string,
    @Query('size') size?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('available') available?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.petsService.findAll({
      species,
      size,
      city,
      state,
      available: available === 'true' ? true : available === 'false' ? false : undefined,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Buscar pets por nome, espécie ou cidade' })
  search(
    @Query('q') q: string,
    @Query('species') species?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.petsService.search(q, species, city, Number(page) || 1, Number(limit) || 20);
  }

  @Get('recommendations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recomendações de pets para o usuário' })
  recommendations(@CurrentUser() user: User) {
    return this.petsService.recommendations(user.id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obter pet por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.findById(id);
  }

  @Get('my/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar meus pets (cadastrados e adotados)' })
  findMyPets(@CurrentUser() user: User) {
    return this.petsService.findMyPets(user.id);
  }

  @Get('owner/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar pets de um usuário' })
  findByOwner(@Param('id', ParseUUIDPipe) id: string) {
    return this.petsService.findByOwner(id);
  }

  @Public()
  @Get('organization/:orgId')
  @ApiOperation({ summary: 'Listar pets de uma organização' })
  findByOrganization(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.petsService.findByOrganization(orgId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar pet' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePetDto,
    @CurrentUser() user: User,
  ) {
    return this.petsService.updateWithOwner(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover pet (soft delete)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.petsService.softRemoveWithOwner(id, user.id, user.role);
  }
}
