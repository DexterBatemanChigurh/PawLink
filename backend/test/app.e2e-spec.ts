import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('POST /auth/register creates user and returns JWT', async () => {
    const email = `test-${Date.now()}@example.com`;
    const { body } = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Test User', email, password: 'Test@123' })
      .expect(201);

    expect(body).toHaveProperty('accessToken');
    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe(email);
  });

  it('POST /auth/login returns JWT for valid credentials', async () => {
    const email = `login-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Login User', email, password: 'Test@123' });

    const { body } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Test@123' })
      .expect(201);

    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
  });

  it('GET /users/me with valid token returns user profile', async () => {
    const email = `me-${Date.now()}@example.com`;
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Me User', email, password: 'Test@123' });

    const token = reg.body.accessToken;

    const { body } = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body.email).toBe(email);
  });

  it('GET /users/me without token returns 401', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
