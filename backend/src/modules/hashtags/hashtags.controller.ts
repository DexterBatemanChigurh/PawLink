import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HashtagsService } from './hashtags.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Hashtags')
@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Listar hashtags em alta' })
  findTrending(@Query('limit') limit?: string) {
    return this.hashtagsService.findTrending(limit ? +limit : undefined);
  }

  @Public()
  @Get(':name/posts')
  @ApiOperation({ summary: 'Buscar posts por hashtag' })
  findPosts(
    @Param('name') name: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.hashtagsService.findPostsByHashtag(name, +page, +limit);
  }
}
