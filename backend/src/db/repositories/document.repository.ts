import { db } from '../connection';
import type { Document, ExtractedFact } from '../../types/document';

export async function saveDocument(document: Document, mimeType: string, facts: ExtractedFact[]): Promise<void> {
  await db('documents').insert({
    id: document.id,
    name: document.name,
    extracted_text: document.text,
    mime_type: mimeType,
    status: 'processed',
    facts_json: JSON.stringify(facts),
  });
}

export async function findDocuments(ids: string[]): Promise<Document[]> {
  return db('documents').select('id', 'name', 'extracted_text as text').whereIn('id', ids);
}
