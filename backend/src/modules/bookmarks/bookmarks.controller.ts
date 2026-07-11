import { Controller, Post, Delete, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':postId')
  @ApiOperation({ summary: 'Salvar um post' })
  add(@Param('postId', ParseUUIDPipe) postId: string, @CurrentUser() user: User) {
    return this.bookmarksService.add(user.id, postId);
  }

  @Delete(':postId')
  @ApiOperation({ summary: 'Remover post salvo' })
  remove(@Param('postId', ParseUUIDPipe) postId: string, @CurrentUser() user: User) {
    return this.bookmarksService.remove(user.id, postId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar posts salvos do usuário' })
  findByUser(@CurrentUser() user: User) {
    return this.bookmarksService.findByUser(user.id);
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Verificar se post está salvo' })
  isBookmarked(@Param('postId', ParseUUIDPipe) postId: string, @CurrentUser() user: User) {
    return this.bookmarksService.isBookmarked(user.id, postId);
  }
}
