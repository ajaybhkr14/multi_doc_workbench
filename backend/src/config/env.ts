import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || '',
  apiKey: process.env.API_KEY?.trim() || '',
  aiModel: process.env.AI_MODEL || 'gpt-4.1-mini',
};
