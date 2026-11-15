import { env } from '../config/env';
import { randomUUID } from 'node:crypto';
import { findDocuments } from '../db/repositories/document.repository';
import { createAnalysis, completeAnalysis, failAnalysis } from '../db/repositories/analysis.repository';
import { HttpError } from '../middleware/error-handler';
import { analyzeMock } from './mock-analysis.service';

export async function analyzeDocuments(documentIds: string[], instruction: string) {
  const uniqueIds = [...new Set(documentIds)];
  const documents = await findDocuments(uniqueIds);
  if (documents.length !== new Set(documentIds).size) {
    throw new HttpError(404, 'One or more documents were not found.');
  }
  if (env.apiKey) {
    throw new HttpError(501, 'AI integration is not implemented. Clear API_KEY to use deterministic mock analysis.');
  }
  const id = randomUUID();
  await createAnalysis(id, uniqueIds, instruction);
  console.info('Analysis started', { analysisId: id, documentCount: documents.length, mode: 'mock' });
  try {
    const result = analyzeMock(documents, instruction);
    await completeAnalysis(id, { ...result.summary, financialSummary: result.financialSummary, limitations: result.limitations }, result.documents, result.findings);
    console.info('Analysis completed', { analysisId: id, factCount: result.summary.factCount, findingCount: result.findings.length });
    return { id, status: 'completed', mode: 'mock', ...result, aiInterpretation: null };
  } catch (error) {
    try {
      await failAnalysis(id);
    } catch (statusError) {
      console.error('Could not mark analysis as failed', { analysisId: id });
    }
    console.error('Analysis failed', { analysisId: id });
    throw error;
  }
}
