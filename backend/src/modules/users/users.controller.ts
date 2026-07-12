import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { User, UserStatus } from './entities/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Criar novo usuário (admin)' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Body('role') role: string,
    @Body('status') status: UserStatus,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem criar usuários diretamente');
    }
    const created = await this.usersService.create(createUserDto, role || 'user');
    if (status) {
      await this.usersService.update(created.id, { status });
      created.status = status;
    }
    return this.usersService.sanitizeUser(created);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.findAll(+page, +limit);
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar usuários por nome' })
  search(@Query('q') q: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.search(q, +page, +limit);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  getProfile(@CurrentUser() user: User) {
    return this.usersService.sanitizeUser(user);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar perfil do usuário logado' })
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.update(user.id, dto);
    return this.usersService.sanitizeUser(updated);
  }

  @Patch('me/settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar configurações de privacidade' })
  async updateSettings(@CurrentUser() user: User, @Body() dto: UpdateSettingsDto) {
    const updated = await this.usersService.updateSettings(user.id, dto);
    return this.usersService.sanitizeUser(updated);
  }

  @Patch('me/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar avatar' })
  async updateAvatar(@CurrentUser() user: User, @Body() dto: UpdateMediaDto) {
    const updated = await this.usersService.updateAvatar(user.id, dto.url);
    return this.usersService.sanitizeUser(updated);
  }

  @Patch('me/cover')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar foto de capa' })
  async updateCover(@CurrentUser() user: User, @Body() dto: UpdateMediaDto) {
    const updated = await this.usersService.updateCoverPhoto(user.id, dto.url);
    return this.usersService.sanitizeUser(updated);
  }

  @Get('admin/users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários (admin)' })
  findAllAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('q') q: string,
    @Query('status') status: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    return this.usersService.findAllAdmin(+page, +limit, q, status);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter usuário por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    return this.usersService.sanitizeUser(user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar qualquer usuário (admin ou próprio)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    if (user.id !== id && user.role !== 'admin') {
      throw new ForbiddenException('Você só pode alterar seu próprio perfil');
    }
    const updated = await this.usersService.update(id, dto);
    return this.usersService.sanitizeUser(updated);
  }

  @Patch('admin/users/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar status do usuário (admin)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      throw new BadRequestException(`Status inválido: ${status}`);
    }
    const updated = await this.usersService.updateStatus(id, status as UserStatus);
    return this.usersService.sanitizeUser(updated);
  }

  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover própria conta — cascade deleta pets, matches e timeline' })
  removeMe(@CurrentUser() user: User) {
    return this.usersService.remove(user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover usuário (admin ou próprio) — cascade deleta pets, matches e timeline' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    if (user.id !== id && user.role !== 'admin') {
      throw new ForbiddenException('Você só pode remover sua própria conta');
    }
    return this.usersService.remove(id);
  }
}
