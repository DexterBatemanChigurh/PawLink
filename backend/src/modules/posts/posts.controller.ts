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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { SharePostDto } from './dto/share-post.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar post' })
  create(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create(dto, user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Posts de um usuário (paginado)' })
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findByUser(userId, Number(page) || 1, Number(limit) || 20);
  }

  @Public()
  @Get('organization/:orgId')
  @ApiOperation({ summary: 'Posts de uma organização' })
  findByOrganization(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.findByOrganization(orgId, Number(page) || 1, Number(limit) || 20);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar post' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.update(id, user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Post por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findById(id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Compartilhar post' })
  share(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SharePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.share(id, user.id, dto.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover post' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.postsService.remove(id, user.id, user.role);
  }
}
