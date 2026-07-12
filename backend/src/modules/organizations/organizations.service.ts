import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager, ILike } from 'typeorm';
import { Organization, OrganizationStatus } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectEntityManager()
    private entityManager: EntityManager,
  ) {}

  async create(dto: CreateOrganizationDto, ownerId: string): Promise<Organization> {
    const existing = await this.orgRepository.findOne({ where: { ownerId } });
    if (existing) {
      throw new ConflictException('Você já possui uma organização');
    }

    const cnpjExists = await this.orgRepository.findOne({ where: { cnpj: dto.cnpj } });
    if (cnpjExists) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    let slug = slugify(dto.name);
    const slugExists = await this.orgRepository.findOne({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const org = this.orgRepository.create({
      ...dto,
      slug,
      ownerId,
      status: OrganizationStatus.PENDING,
    });

    return this.orgRepository.save(org);
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { id },
      relations: { owner: true },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    return org;
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({
      where: { slug },
      relations: { owner: true },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    return org;
  }

  async findByOwner(ownerId: string): Promise<Organization | null> {
    return this.orgRepository.findOne({
      where: { ownerId },
      relations: { owner: true },
    });
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    const org = await this.findById(id);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Apenas o proprietário pode editar');
    }
    Object.assign(org, dto);
    return this.orgRepository.save(org);
  }

  async approve(id: string): Promise<Organization> {
    const org = await this.findById(id);
    org.status = OrganizationStatus.APPROVED;
    org.verified = true;
    return this.orgRepository.save(org);
  }

  async reject(id: string): Promise<Organization> {
    const org = await this.findById(id);
    org.status = OrganizationStatus.REJECTED;
    org.verified = false;
    return this.orgRepository.save(org);
  }

  async findAll(): Promise<Organization[]> {
    return this.orgRepository.find({
      order: { createdAt: 'DESC' },
      relations: { owner: true },
    });
  }

  async search(q: string): Promise<Organization[]> {
    return this.orgRepository.find({
      where: [
        { name: ILike(`%${q}%`), status: OrganizationStatus.APPROVED },
        { city: ILike(`%${q}%`), status: OrganizationStatus.APPROVED },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<Organization[]> {
    return this.orgRepository.find({
      where: { status: OrganizationStatus.PENDING },
      order: { createdAt: 'ASC' },
      relations: { owner: true },
    });
  }

  async deleteWithCascade(id: string, userId: string): Promise<void> {
    const org = await this.findById(id);
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Apenas o proprietário pode excluir a organização');
    }

    await this.entityManager.transaction(async (tx) => {
      await tx.query(`DELETE FROM posts WHERE "organizationId" = $1`, [id]);
      await tx.query(`DELETE FROM pets WHERE "organizationId" = $1`, [id]);
      await tx.query(`DELETE FROM organizations WHERE id = $1`, [id]);
    });
  }
}
