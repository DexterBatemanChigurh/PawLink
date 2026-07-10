import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Comentar em um post' })
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.create(id, user.id, dto);
  }

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Comentários de um post' })
  findByPost(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findByPost(id);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Remover próprio comentário' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.remove(id, user.id);
  }
}
