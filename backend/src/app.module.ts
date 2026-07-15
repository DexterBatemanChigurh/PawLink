import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PetsModule } from './modules/pets/pets.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { MatchesModule } from './modules/matches/matches.module';
import { AdminModule } from './modules/admin/admin.module';
import { MessagesModule } from './modules/messages/messages.module';
import { FollowsModule } from './modules/follows/follows.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FeedModule } from './modules/feed/feed.module';
import { UploadModule } from './modules/upload/upload.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PushSubscriptionsModule } from './modules/push-subscriptions/push-subscriptions.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { HashtagsModule } from './modules/hashtags/hashtags.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsRun: false,
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.throttleTtl') || 60,
            limit: configService.get<number>('app.throttleLimit') || 100,
          },
        ],
      }),
    }),

    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000,
    }),

    UsersModule,
    AuthModule,
    PetsModule,
    TimelineModule,
    MatchesModule,
    AdminModule,
    MessagesModule,
    FollowsModule,
    PostsModule,
    ReactionsModule,
    CommentsModule,
    NotificationsModule,
    FeedModule,
    UploadModule,
    BlocksModule,
    ReportsModule,
    PushSubscriptionsModule,
    FavoritesModule,
    BookmarksModule,
    HashtagsModule,
    OrganizationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
