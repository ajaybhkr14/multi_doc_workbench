import type { Document } from '../types/document';
import type { DocumentType } from '../types/analysis';

export function classifyDocument(document: Document): DocumentType {
  const content = `${document.name}\n${document.text.slice(0, 4000)}`.toLowerCase().replace(/[_-]/g, ' ');
  // Explicit titles take priority over references to supporting documents.
  const heading = `${document.name}\n${document.text.split(/\r?\n/).slice(0, 4).join('\n')}`.toLowerCase().replace(/[_-]/g, ' ');
  const rules: [DocumentType, RegExp][] = [
    ['salary_slip', /salary\s*slip|pay\s*slip|pay\s*statement/],
    ['bank_statement', /bank\s*statement|account\s*statement/],
    ['application', /application|onboarding\s*form/],
    ['financial_statement', /balance\s*sheet|financial\s*statement|profit\s*(?:and|&)\s*loss/],
    ['aadhaar', /aadha+a?r|adhaar|uidai/],
    ['pan', /\bpan\b|permanent\s*account\s*number|income\s*tax\s*department/],
  ];
  return rules.find(([, pattern]) => pattern.test(heading))?.[0]
    || rules.find(([, pattern]) => pattern.test(content))?.[0] || 'unknown';
}
