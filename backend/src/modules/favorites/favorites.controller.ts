import { Controller, Post, Delete, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':petId')
  @ApiOperation({ summary: 'Favoritar um pet' })
  add(@Param('petId', ParseUUIDPipe) petId: string, @CurrentUser() user: User) {
    return this.favoritesService.add(user.id, petId);
  }

  @Delete(':petId')
  @ApiOperation({ summary: 'Remover favorito de um pet' })
  remove(@Param('petId', ParseUUIDPipe) petId: string, @CurrentUser() user: User) {
    return this.favoritesService.remove(user.id, petId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar favoritos do usuário' })
  findByUser(@CurrentUser() user: User) {
    return this.favoritesService.findByUser(user.id);
  }

  @Get(':petId')
  @ApiOperation({ summary: 'Verificar se pet está favoritado' })
  isFavorited(@Param('petId', ParseUUIDPipe) petId: string, @CurrentUser() user: User) {
    return this.favoritesService.isFavorited(user.id, petId);
  }
}
