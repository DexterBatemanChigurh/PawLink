import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar organização' })
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: User) {
    return this.orgService.create(dto, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Minha organização' })
  findMy(@CurrentUser() user: User) {
    return this.orgService.findByOwner(user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Organizações pendentes (admin)' })
  findPending() {
    return this.orgService.findPending();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter organização por slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.orgService.findBySlug(slug);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as organizações' })
  findAll() {
    return this.orgService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter organização por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar organização' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: User,
  ) {
    return this.orgService.update(id, dto, user.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar organização (admin)' })
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.approve(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeitar organização (admin)' })
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.orgService.reject(id);
  }
}
