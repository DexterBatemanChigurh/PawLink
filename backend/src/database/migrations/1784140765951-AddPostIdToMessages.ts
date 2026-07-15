import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostIdToMessages1784140765951 implements MigrationInterface {
    name = 'AddPostIdToMessages1784140765951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "emailVerified" SET DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "emailVerified" SET DEFAULT false`);
    }

}
