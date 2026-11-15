import { env } from '../config/env';
import { findDocuments } from '../db/repositories/document.repository';
import { HttpError } from '../middleware/error-handler';
import { analyzeMock, extractFacts } from './mock-analysis.service';

export async function analyzeDocuments(documentIds: string[], instruction: string) {
  const documents = await findDocuments(documentIds);
  if (documents.length !== new Set(documentIds).size) {
    throw new HttpError(404, 'One or more documents were not found.');
  }
  const extractedFacts = extractFacts(documents);
  if (!env.apiKey) {
    return { mode: 'mock', extractedFacts, ruleBasedFindings: analyzeMock(extractedFacts, instruction), aiInterpretation: null };
  }
  // Provider integration belongs here when AI analysis is added.
  throw new HttpError(501, 'AI integration is not implemented in this scaffold. Clear API_KEY to use mock analysis.');
}
