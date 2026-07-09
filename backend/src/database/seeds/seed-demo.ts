import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PetsService } from '../../modules/pets/pets.service';
import { TimelineService } from '../../modules/timeline/timeline.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const petsService = app.get(PetsService);
  const timelineService = app.get(TimelineService);

  try {
    const existing = await petsService.findAll({ page: 1, limit: 1, available: true });

    if (existing.pets.length > 0) {
      console.log('Demo já foi populado');
      await app.close();
      return;
    }

    const pet = await petsService.create({
      name: 'Bolinha',
      species: 'dog' as any,
      breed: 'SRD',
      color: 'Caramelo',
      size: 'small' as any,
      age: 2,
      ageUnit: 'anos',
      castrated: true,
      vaccinated: true,
      temperament: 'Brincalhão e muito carinhoso. Adora crianças e outros cachorros.',
      story: 'Resgatado das ruas do bairro Jardim América em uma noite chuvosa. Estava magro e assustado, mas depois de muito carinho se recuperou completamente.',
      personality: 'Alegre, brincalhão, leal e um pouco bagunceiro',
      city: 'Uberlândia',
      state: 'MG',
      photos: [],
    }, '085cd516-c486-4ad5-91da-1f7dd009a681');

    console.log('Pet "Bolinha" criado com ID:', pet.id);

    await timelineService.create(pet.id, {
      type: 'rescue' as any,
      title: 'Resgate das ruas',
      description: 'Encontrado no bairro Jardim América, magro e com sinais de maus-tratos. Resgatado por voluntários da ONG.',
      eventDate: '2025-03-15',
    });

    await timelineService.create(pet.id, {
      type: 'vaccine' as any,
      title: 'Vacinação V10',
      description: 'Primeira dose da vacina V10 aplicada.',
      eventDate: '2025-03-20',
      vetName: 'Dr. Carlos Silva',
      clinicName: 'Clínica PetCare',
    });

    await timelineService.create(pet.id, {
      type: 'treatment' as any,
      title: 'Tratamento contra sarna',
      description: 'Diagnosticado com sarna demodécica. Iniciou tratamento com medicação tópica e oral.',
      eventDate: '2025-03-25',
      vetName: 'Dra. Ana Oliveira',
    });

    await timelineService.create(pet.id, {
      type: 'weight' as any,
      title: 'Ganho de peso significativo',
      description: 'Passou de 4kg para 7kg após 2 meses de alimentação adequada.',
      eventDate: '2025-05-10',
    });

    await timelineService.create(pet.id, {
      type: 'vaccine' as any,
      title: 'Vacina Antirrábica',
      description: 'Vacina antirrábica aplicada conforme calendário.',
      eventDate: '2025-04-10',
      vetName: 'Dr. Carlos Silva',
    });

    await timelineService.create(pet.id, {
      type: 'castration' as any,
      title: 'Castração',
      description: 'Procedimento realizado sem intercorrências. Período pós-operatório tranquilo.',
      eventDate: '2025-06-01',
      vetName: 'Dr. Roberto Mendes',
      clinicName: 'Hospital Veterinário São Francisco',
    });

    await timelineService.create(pet.id, {
      type: 'microchip' as any,
      title: 'Microchipagem',
      description: 'Inserido microchip de identificação sob a pele.',
      eventDate: '2025-06-15',
      vetName: 'Dr. Carlos Silva',
    });

    await timelineService.create(pet.id, {
      type: 'checkup' as any,
      title: 'Check-up geral',
      description: 'Exames de sangue e fezes normais. Animal saudável e pronto para adoção.',
      eventDate: '2025-12-20',
      vetName: 'Dra. Ana Oliveira',
    });

    console.log('Timeline do Bolinha populada com 8 eventos!');
  } catch (error: any) {
    console.log('Erro:', error.message);
  }

  await app.close();
}

seed();
