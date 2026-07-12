import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillOrgVerified1783877719984 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE organizations SET verified = true WHERE status = 'approved'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE organizations SET verified = false WHERE status = 'approved'`);
    }

}
