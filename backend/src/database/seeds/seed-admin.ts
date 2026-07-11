import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../modules/users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const admin = await usersService.create({
      email: 'admin@pawlink.com',
      password: 'admin123',
      name: 'Administrador',
    }, 'admin');

    await usersService.update(admin.id, {
      emailVerified: true,
      status: 'active' as any,
    });

    console.log('Admin criado com sucesso!');
    console.log('Email: admin@pawlink.com');
    console.log('Senha: admin123');
  } catch (error: any) {
    console.log('Erro:', error.message);
  }

  await app.close();
}

seed();
