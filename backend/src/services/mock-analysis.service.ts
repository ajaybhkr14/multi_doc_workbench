import type { Document, ExtractedFact } from '../types/document';

const aliases: Record<string, string> = {
  'applicant name': 'name', 'customer name': 'name', 'full name': 'name',
  dob: 'date of birth', 'residential address': 'address',
  'declared income': 'income', 'verified income': 'income',
  salary: 'income', 'monthly salary': 'income', 'monthly income': 'income',
  'total assets': 'assets', 'total liabilities': 'liabilities',
  'annual revenue': 'revenue', 'requested loan amount': 'loan amount',
};

export function extractFacts(documents: Document[]): ExtractedFact[] {
  return documents.flatMap((document) => document.text.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([\w ()/.-]+?)\s*[:=]\s*(.+?)\s*$/);
    if (!match) return [];
    const label = match[1].toLowerCase().trim().replace(/\s+/g, ' ');
    return [{
      documentId: document.id,
      documentName: document.name,
      field: aliases[label] || label,
      value: match[2],
      evidence: line.trim(),
    }];
  }));
}

function normalize(value: string): string {
  const numeric = value.replace(/^(?:INR|Rs\.?|₹|USD|\$)\s*/i, '').replace(/,/g, '').trim();
  if (/^-?\d+(\.\d+)?$/.test(numeric)) return String(Number(numeric));
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function analyzeMock(facts: ExtractedFact[], instruction: string) {
  const fields = new Map<string, ExtractedFact[]>();
  for (const fact of facts) {
    fields.set(fact.field, [...(fields.get(fact.field) || []), fact]);
  }
  const discrepancies = [...fields].flatMap(([field, values]) => {
    if (new Set(values.map((fact) => normalize(fact.value))).size < 2) return [];
    return [{ field, message: `Different values found for ${field}.`, evidence: values }];
  });
  const expectedFields = /kyc|onboard|identity/i.test(instruction)
    ? ['name', 'address', 'date of birth']
    : /loan|income|salary/i.test(instruction) ? ['name', 'income', 'loan amount']
    : /compan|financial statement/i.test(instruction) ? ['revenue', 'assets', 'liabilities']
    : /bank statement|transaction|balance/i.test(instruction) ? ['account number', 'balance'] : [];

  return {
    discrepancies,
    missingFields: expectedFields.filter((field) => !fields.has(field)),
    summary: `${facts.length} labeled facts extracted; ${discrepancies.length} fields contain differing values.`,
    limitations: [
      'Mock extraction reads one Label: Value or Label = Value pair per line.',
      'Differing values need review: currency, period, entity, and document context may explain them.',
      'Mock instructions select field checks using keywords; arbitrary instructions require AI mode.',
      'Missing fields mean no labeled evidence was found; document authenticity is not verified.',
    ],
  };
}
