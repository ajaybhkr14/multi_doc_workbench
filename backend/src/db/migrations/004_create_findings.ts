import type { Knex } from 'knex';

export async function up(db: Knex): Promise<void> {
  await db.schema.createTable('findings', (table) => {
    table.uuid('id').primary().defaultTo(db.raw('gen_random_uuid()'));
    table.uuid('analysis_id').notNullable().references('id').inTable('analysis').onDelete('CASCADE');
    table.text('description').notNullable();
    table.jsonb('evidence_json').notNullable().defaultTo(db.raw("'[]'::jsonb"));
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(db.fn.now());
    table.text('type').notNullable();
    // Examples: rule_based or ai_generated; keep provenance separate from finding type.
    table.text('origin').notNullable();
    table.index('analysis_id');
  });
}

export async function down(db: Knex): Promise<void> {
  await db.schema.dropTable('findings');
}
