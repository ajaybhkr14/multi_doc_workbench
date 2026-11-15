import type { Knex } from 'knex';

export async function up(db: Knex): Promise<void> {
  await db.schema.alterTable('documents', (table) => {
    table.renameColumn('text', 'extracted_text');
    table.renameColumn('createdAt', 'created_at');
    table.text('status').notNullable().defaultTo('processed');
    table.text('mime_type').notNullable().defaultTo('text/plain');
    table.jsonb('facts_json').notNullable().defaultTo(db.raw("'[]'::jsonb"));
  });
  await db.schema.alterTable('documents', (table) => {
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(db.fn.now()).alter();
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.alterTable('documents', (table) => {
    table.timestamp('created_at', { useTz: true }).nullable().defaultTo(db.fn.now()).alter();
    table.dropColumns('status', 'mime_type', 'facts_json');
    table.renameColumn('extracted_text', 'text');
    table.renameColumn('created_at', 'createdAt');
  });
}
