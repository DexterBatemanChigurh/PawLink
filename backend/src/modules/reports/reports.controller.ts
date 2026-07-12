import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('users/:id/report')
  @ApiOperation({ summary: 'Denunciar usuário' })
  reportUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.create(user.id, id, dto);
  }

  @Post('posts/:id/report')
  @ApiOperation({ summary: 'Denunciar post' })
  reportPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportDto,
    @CurrentUser() user: User,
  ) {
    return this.reportsService.createForPost(user.id, id, dto);
  }

  @Get('admin/reports')
  @ApiOperation({ summary: 'Listar denúncias (admin)' })
  findAll(
    @Query('status') status: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    return this.reportsService.findAll(status, +page, +limit);
  }

  @Patch('admin/reports/:id')
  @ApiOperation({ summary: 'Atualizar status da denúncia (admin)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    return this.reportsService.updateStatus(id, status, user.id);
  }

  @Patch('admin/reports/:id/resolve')
  @ApiOperation({ summary: 'Resolver denúncia (admin)' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    return this.reportsService.resolve(id, user.id);
  }

  @Patch('admin/reports/:id/dismiss')
  @ApiOperation({ summary: 'Dispensar denúncia (admin)' })
  dismiss(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    if (user.role !== 'admin') throw new ForbiddenException('Apenas administradores');
    return this.reportsService.dismiss(id, user.id);
  }
}
