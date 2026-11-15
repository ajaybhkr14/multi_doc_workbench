import type { ExtractedFact } from './document';

export type DocumentType = 'pan' | 'aadhaar' | 'salary_slip' | 'bank_statement' | 'application' | 'financial_statement' | 'unknown';

export interface DocumentEvidence {
  documentId: string;
  documentName: string;
  filename: string;
  documentType: DocumentType;
  evidence: string;
  lineNumber: number | null;
  field?: string;
  value?: string;
}

export interface Finding {
  id: string;
  type: 'inconsistency' | 'numeric_difference' | 'missing_document' | 'missing_field' | 'invalid_format' | 'match' | 'review_required';
  origin: 'rule_based';
  description: string;
  evidence: DocumentEvidence[];
  calculation?: {
    leftValue: number;
    rightValue: number;
    difference: number;
    absoluteDifference: number;
    // Signed percentage relative to rightValue; null when that baseline is zero.
    percentageDifference: number | null;
    currency: string;
    period: string;
  };
}

export interface AnalyzedDocument {
  documentId: string;
  documentName: string;
  filename: string;
  documentType: DocumentType;
  facts: ExtractedFact[];
}
