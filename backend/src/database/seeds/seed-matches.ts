import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MatchesService } from '../../modules/matches/matches.service';
import { MatchStatus } from '../../modules/matches/entities/match.entity';
import { PetsService } from '../../modules/pets/pets.service';
import { UsersService } from '../../modules/users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const matchesService = app.get(MatchesService);
  const petsService = app.get(PetsService);
  const usersService = app.get(UsersService);

  try {
    const existingMatches = await matchesService.findAll();
    if (existingMatches.length > 0) {
      console.log('Matches já foram populados');
      await app.close();
      return;
    }

    const { pets } = await petsService.findAll({ page: 1, limit: 1, available: true });
    if (pets.length === 0) {
      console.log('Nenhum pet disponível encontrado. Execute seed-demo primeiro.');
      await app.close();
      return;
    }

    const pet = pets[0]!;

    const { users } = await usersService.findAll();
    const nonOwnerUsers = users.filter(u => u.id !== pet.ownerId);

    if (nonOwnerUsers.length === 0) {
      const adminUser = await usersService.findByEmail('admin@pawlink.com');
      if (adminUser) {
        nonOwnerUsers.push(adminUser);
      }
    }

    if (nonOwnerUsers.length === 0) {
      console.log('Nenhum usuário disponível para criar matches');
      await app.close();
      return;
    }

    const statuses: MatchStatus[] = [MatchStatus.PENDING, MatchStatus.ACCEPTED, MatchStatus.REJECTED];
    for (let i = 0; i < Math.min(nonOwnerUsers.length, 3); i++) {
      const match = await matchesService.create(pet.id, nonOwnerUsers[i]!.id, {
        message: [
          'Olá! Tenho muito amor para dar e um quintal grande. Gostaria muito de adotar o Bolinha!',
          'Sempre quis um cachorro para fazer companhia. Moro em casa com espaço e tenho experiência com pets.',
          'Já tive cachorros a vida toda e atualmente estou procurando um novo amigo para adotar.',
        ][i],
        phone: '(34) 9' + `${9000 + i * 111}`.padStart(4, '0') + '-' + `${1000 + i * 111}`.padStart(4, '0'),
      });

      if (i > 0) {
        await matchesService.updateStatus(match.id, pet.ownerId, { status: statuses[i] });
      }

      console.log(`Match ${i + 1} criado: ${nonOwnerUsers[i]!.name} -> ${pet.name} (${statuses[i]})`);
    }

    console.log('Seed de matches concluído!');
  } catch (error: any) {
    console.log('Erro:', error.message);
  }

  await app.close();
}

seed();
