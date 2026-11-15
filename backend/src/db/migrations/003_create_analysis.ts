import type { Knex } from 'knex';

export async function up(db: Knex): Promise<void> {
  await db.schema.createTable('analysis', (table) => {
    table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
    table.specificType('document_ids', 'uuid[]').notNullable();
    table.text('instruction').notNullable();
    table.text('status').notNullable().defaultTo('pending');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(db.fn.now());
    table.jsonb('summary_json').nullable();
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.dropTable('analysis');
}
