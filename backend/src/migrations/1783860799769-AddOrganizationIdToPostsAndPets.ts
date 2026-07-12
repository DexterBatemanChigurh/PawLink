import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationIdToPostsAndPets1783860799769 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "pets" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "pets" ADD CONSTRAINT "FK_pets_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pets" DROP CONSTRAINT IF EXISTS "FK_pets_organization"`);
        await queryRunner.query(`ALTER TABLE "pets" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "FK_posts_organization"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "organizationId"`);
    }

}
