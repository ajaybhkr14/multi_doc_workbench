import type { Knex } from 'knex';

export async function up(db: Knex): Promise<void> {
  await db.schema.createTable('documents', (table) => {
    table.uuid('id').primary();
    table.text('name').notNullable();
    table.text('text').notNullable();
    table.timestamp('createdAt', { useTz: true }).defaultTo(db.fn.now());
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.dropTableIfExists('documents');
}
