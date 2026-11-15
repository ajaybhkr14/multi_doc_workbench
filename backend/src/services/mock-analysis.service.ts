import { randomUUID } from 'node:crypto';
import type { Document, ExtractedFact } from '../types/document';
import type { AnalyzedDocument, DocumentEvidence, DocumentType, Finding } from '../types/analysis';
import { classifyDocument } from './document-classification.service';
import { extractFacts } from './fact-extraction.service';
import { checkNumericFacts } from './numeric-checks.service';

export { extractFacts } from './fact-extraction.service';

export function normalize(value: string): string {
  return value.toLowerCase().replace(/\b(?:mr|mrs|ms|dr)\.?\s+/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

function normalizeDate(value: string): string {
  const named = value.match(/^(\d{1,2})[\s-]+([A-Za-z]+)[\s,-]+(\d{4})$/);
  if (named) {
    const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(named[2].slice(0, 3).toLowerCase()) + 1;
    if (month) return `${named[3]}-${String(month).padStart(2, '0')}-${named[1].padStart(2, '0')}`;
  }
  const match = value.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})$/);
  if (!match) return normalize(value);
  const [, first, middle, last] = match;
  return first.length === 4 ? `${first}-${middle.padStart(2, '0')}-${last.padStart(2, '0')}`
    : `${last}-${middle.padStart(2, '0')}-${first.padStart(2, '0')}`;
}

export function analyzeMock(documents: Document[], instruction: string) {
  const analyzed: AnalyzedDocument[] = documents.map((document) => ({
    documentId: document.id, documentName: document.name, filename: document.name,
    documentType: classifyDocument(document), facts: extractFacts([document]),
  }));
  const facts = analyzed.flatMap((document) => document.facts);
  const findings: Finding[] = [];
  const source = (fact: ExtractedFact): DocumentEvidence => ({ ...fact,
    documentType: analyzed.find((document) => document.documentId === fact.documentId)!.documentType });
  const inventory = (document: AnalyzedDocument): DocumentEvidence => ({
    documentId: document.documentId, documentName: document.documentName, filename: document.filename, documentType: document.documentType,
    evidence: `Supplied document classified as ${document.documentType}; extracted fields: ${[...new Set(document.facts.map((fact) => fact.field))].join(', ') || 'none'}. Source excerpt: ${documents.find((source) => source.id === document.documentId)!.text.slice(0, 300)}`,
    lineNumber: null,
  });
  const add = (type: Finding['type'], description: string, evidence: DocumentEvidence[]) => {
    findings.push({ id: randomUUID(), type, origin: 'rule_based', description, evidence });
  };
  const scope = {
    kyc: /kyc|onboard|identity|name|address|birth/i.test(instruction),
    pan: /\bpan\b/i.test(instruction), aadhaar: /aadha+a?r|adhaar|uidai/i.test(instruction),
    income: /income|salary|pay\s*slip|employment/i.test(instruction),
    bank: /bank|transaction|balance/i.test(instruction), loan: /loan|lending/i.test(instruction),
    financial: /financial|revenue|assets|liabilities|compan/i.test(instruction),
  };
  const recognized = Object.values(scope).some(Boolean);
  if (!recognized) {
    scope.kyc = analyzed.some((document) => ['pan', 'aadhaar', 'application'].includes(document.documentType));
    scope.income = analyzed.some((document) => document.documentType === 'salary_slip');
    scope.bank = analyzed.some((document) => document.documentType === 'bank_statement');
    scope.financial = analyzed.some((document) => document.documentType === 'financial_statement');
  }
  const required = new Set<DocumentType>();
  if (scope.kyc || scope.loan || scope.pan) required.add('pan');
  if (scope.kyc || scope.loan || scope.aadhaar) required.add('aadhaar');
  if (scope.income || scope.loan) { required.add('salary_slip'); required.add('bank_statement'); }
  if (scope.bank) required.add('bank_statement');
  if (scope.loan) required.add('application');
  if (scope.financial) required.add('financial_statement');
  for (const type of required) {
    if (!analyzed.some((document) => document.documentType === type)) {
      add('missing_document', `No ${type.replace(/_/g, ' ')} was identified among the supplied documents. This is an instruction-based checklist item.`, analyzed.map(inventory));
    }
  }
  const requiredFields: Partial<Record<DocumentType, string[]>> = {
    pan: ['name', 'date_of_birth', 'pan'], aadhaar: ['name', 'date_of_birth', 'address', 'aadhaar'],
    salary_slip: ['name', 'employer', 'net_salary', 'period'], bank_statement: ['account_number', 'balance', 'period'],
    application: ['name', 'address', 'declared_income', 'loan_amount'],
    financial_statement: ['company_name', 'revenue', 'assets', 'liabilities', 'period'],
  };
  for (const document of analyzed) {
    if (document.documentType === 'unknown') add('review_required', 'Document type could not be identified; missing-document checks may need manual review.', [inventory(document)]);
    if (!document.facts.length) add('review_required', 'No supported fields were extracted from this document.', [inventory(document)]);
    if (!required.has(document.documentType)) continue;
    for (const field of requiredFields[document.documentType] || []) {
      const present = document.facts.some((fact) => fact.field === field ||
        (field === 'declared_income' && fact.field === 'income') || (field === 'net_salary' && fact.field === 'income'));
      if (!present) add('missing_field', `No extractable ${field.replace(/_/g, ' ')} was found in ${document.documentName}.`, [inventory(document)]);
    }
  }
  const identityFields = new Set<string>();
  if (scope.kyc || scope.loan || scope.pan || scope.aadhaar) ['name', 'address', 'date_of_birth', 'pan', 'aadhaar'].forEach((field) => identityFields.add(field));
  if (scope.income || scope.loan) ['name', 'employer'].forEach((field) => identityFields.add(field));
  for (const field of identityFields) {
    const values = facts.filter((fact) => fact.field === field);
    if (values.length < 2) continue;
    const normalized = values.map((fact) => field === 'date_of_birth' ? normalizeDate(fact.value)
      : ['pan', 'aadhaar'].includes(field) ? fact.value.toUpperCase().replace(/[ -]/g, '') : normalize(fact.value));
    if (field === 'aadhaar' && values.some((fact) => /[x*]/i.test(fact.value))) {
      const mismatch = new Set(values.map((fact) => fact.value.replace(/[ -]/g, '').slice(-4))).size > 1;
      add(mismatch ? 'inconsistency' : 'review_required', mismatch ? 'Aadhaar suffixes differ across documents.' : 'Visible Aadhaar suffixes agree, but masking prevents a full-number comparison.', values.map(source));
    } else {
      const same = new Set(normalized).size === 1;
      add(same ? 'match' : 'inconsistency', `${field.replace(/_/g, ' ')} ${same ? 'agrees' : 'differs'} across the supplied documents.`, values.map(source));
    }
  }
  for (const fact of facts) {
    if (fact.field === 'pan' && (scope.kyc || scope.pan || scope.loan) && !/^[A-Z]{5}\d{4}[A-Z]$/.test(fact.value.replace(/\s/g, '').toUpperCase())) {
      add('invalid_format', 'PAN does not match the expected 10-character format.', [source(fact)]);
    }
    if (fact.field === 'aadhaar' && (scope.kyc || scope.aadhaar || scope.loan) && !/^(?:\d{12}|[Xx*]{8}\d{4})$/.test(fact.value.replace(/[ -]/g, ''))) {
      add('invalid_format', 'Aadhaar does not contain 12 digits or a supported masked representation.', [source(fact)]);
    }
  }
  const numeric = checkNumericFacts(analyzed, scope);
  findings.push(...numeric.findings);
  return {
    documents: analyzed, extractedFacts: facts, findings, financialSummary: numeric.financialSummary,
    summary: {
      documentCount: documents.length, factCount: facts.length, findingCount: findings.length,
      inconsistencyCount: findings.filter((finding) => ['inconsistency', 'numeric_difference', 'invalid_format'].includes(finding.type)).length,
      missingDocumentCount: findings.filter((finding) => finding.type === 'missing_document').length,
      missingFieldCount: findings.filter((finding) => finding.type === 'missing_field').length, checks: scope,
    },
    limitations: [
      'Deterministic extraction supports common labeled fields, PAN/Aadhaar patterns, and simple amounts; complex tables and unlabeled text may need manual review.',
      'Document types are inferred from filenames and content. Missing documents and fields refer only to the supplied evidence.',
      'PAN/Aadhaar checks validate format and consistency only; authenticity, government records, and checksums are not verified.',
      'Explicit annual and monthly income is normalized to monthly values in TypeScript. Gross and net salary are kept separate.',
      'Unknown currencies and reporting periods are flagged. No exchange rates, OCR, or transaction matching are inferred.',
      ...(!recognized ? ['No specific instruction category was recognized; checks were selected from inferred document types.'] : []),
    ],
  };
}
