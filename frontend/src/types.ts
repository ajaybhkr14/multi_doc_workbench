import type { AnalyzedDocument, DocumentEvidence, Finding } from '../../backend/src/types/analysis';
import type { ExtractedFact } from '../../backend/src/types/document';

export type { AnalyzedDocument, DocumentEvidence, Finding, ExtractedFact };

export interface UploadItem {
  key: string;
  file: File;
  status: 'selected' | 'invalid' | 'uploading' | 'uploaded' | 'failed';
  id?: string;
  error?: string;
}

export interface UploadResponse {
  documents: { id?: string; name: string; status: 'uploaded' | 'failed'; error?: string }[];
}

export interface AnalysisReport {
  id: string;
  mode: 'mock';
  status: string;
  documents: AnalyzedDocument[];
  extractedFacts: ExtractedFact[];
  findings: Finding[];
  financialSummary: {
    documentId: string;
    filename: string;
    field: string;
    rawValue: string;
    amount: number;
    currency: string;
    period: string;
    evidence: DocumentEvidence;
  }[];
  summary: {
    documentCount: number;
    factCount: number;
    findingCount: number;
    inconsistencyCount: number;
    missingDocumentCount: number;
    missingFieldCount: number;
  };
  limitations: string[];
  aiInterpretation: null;
}
