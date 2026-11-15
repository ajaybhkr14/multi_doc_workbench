import { db } from '../connection';
import type { AnalyzedDocument, Finding } from '../../types/analysis';

export async function createAnalysis(id: string, documentIds: string[], instruction: string): Promise<void> {
  await db('analysis').insert({ id, document_ids: documentIds, instruction, status: 'processing' });
}

export async function completeAnalysis(id: string, summary: object, documents: AnalyzedDocument[], findings: Finding[]): Promise<void> {
  await db.transaction(async (transaction) => {
    for (const document of documents) {
      await transaction('documents').where({ id: document.documentId }).update({ facts_json: JSON.stringify(document.facts) });
    }
    if (findings.length) {
      await transaction('findings').insert(findings.map((finding) => ({
        id: finding.id, analysis_id: id, description: finding.description, type: finding.type, origin: finding.origin,
        evidence_json: JSON.stringify({ sources: finding.evidence, calculation: finding.calculation ?? null }),
      })));
    }
    await transaction('analysis').where({ id }).update({ status: 'completed', summary_json: JSON.stringify(summary) });
  });
}

export async function failAnalysis(id: string): Promise<void> {
  await db('analysis').where({ id }).update({ status: 'failed' });
}
