import type { Document, ExtractedFact } from '../types/document';

const fieldPatterns: [string, RegExp][] = [
  ['company_name', /^(?:company|entity|business) name$/i],
  ['name', /^(?:(?:applicant|customer|employee|account holder|card holder|full) )?name$/i],
  ['address', /^(?:(?:residential|permanent|current|mailing|customer) )?address$/i],
  ['date_of_birth', /^(?:dob|d o b|date of birth|birth date)$/i],
  ['pan', /^(?:pan(?: (?:no|number))?|permanent account number)$/i],
  ['aadhaar', /^(?:aadha+a?r|adhaar|uid)(?: (?:no|number))?$/i],
  ['employer', /^(?:employer(?: name)?|organisation|organization|company)$/i],
  ['declared_income', /^(?:declared|applicant)(?: (?:monthly|annual|yearly))? income$/i],
  ['net_salary', /^(?:(?:monthly |annual )?net (?:salary|pay)|net (?:monthly |annual )?(?:salary|pay)|take home(?: salary)?|salary credited)$/i],
  ['gross_salary', /^(?:(?:monthly |annual )?gross (?:salary|pay)|gross (?:monthly |annual )?(?:salary|pay)|total earnings)$/i],
  ['salary_credit', /^(?:(?:monthly )?salary credit|salary deposit)$/i],
  ['income', /^(?:(?:monthly|annual|yearly|verified) )?(?:income|salary)$/i],
  ['loan_amount', /^(?:(?:requested|proposed|applied) )?loan amount$/i],
  ['outstanding_loan', /^(?:outstanding (?:loan|loan amount|balance)|loan outstanding)$/i],
  ['account_number', /^(?:bank )?account (?:number|no)$/i],
  ['balance', /^(?:(?:account|closing|current|available) )?balance$/i],
  ['opening_balance', /^opening balance$/i],
  ['revenue', /^(?:(?:total|annual|yearly) )?(?:revenue|turnover)$/i],
  ['assets', /^(?:total )?assets$/i],
  ['liabilities', /^(?:total )?liabilities$/i],
  ['currency', /^currency$/i],
  ['period', /^(?:period|pay period|pay month|salary month|statement period|financial year|fiscal year|assessment year|month|year)$/i],
  ['employment', /^(?:employment(?: status| type)?|occupation|designation)$/i],
  ['transaction_amount', /^(?:transaction|credit|debit) amount$/i],
  ['transaction_date', /^transaction date$/i],
];

export function extractFacts(documents: Document[]): ExtractedFact[] {
  return documents.flatMap((document) => {
    const lines = document.text.split(/\r?\n/);
    const facts: ExtractedFact[] = [];
    const add = (field: string, value: string, lineNumber: number, sourceLabel: string) => {
      if (!value.trim() || /^(?:n\/?a|not provided|unknown|-)$/i.test(value.trim())) return;
      if (facts.some((fact) => fact.field === field && fact.lineNumber === lineNumber && fact.value === value.trim())) return;
      facts.push({ documentId: document.id, documentName: document.name, filename: document.name, field, value: value.trim(),
        evidence: lines[lineNumber - 1].trim(), lineNumber, sourceLabel });
    };
    lines.forEach((line, index) => {
      // Match labels followed by a separator or whitespace; preserve the original line.
      const labeled = line.match(/^\s*([^:=|\t]+?)\s*[:=|\t]\s*(.+?)\s*$/);
      if (labeled) {
        const label = labeled[1].replace(/[._]/g, ' ').replace(/\s+/g, ' ').trim();
        const field = fieldPatterns.find(([, pattern]) => pattern.test(label))?.[0];
        if (field) add(field, labeled[2], index + 1, label);
        // Addresses frequently span lines in PDF text extraction.
        if (field === 'address') {
          const continuation: string[] = [];
          for (let next = index + 1; next < Math.min(index + 4, lines.length); next++) {
            if (!lines[next].trim() || /[:=|\t]/.test(lines[next]) || !/[a-z0-9]/i.test(lines[next])) break;
            continuation.push(lines[next].trim());
          }
          if (continuation.length) {
            const fact = facts.find((item) => item.field === 'address' && item.lineNumber === index + 1);
            if (fact) { fact.value += ` ${continuation.join(' ')}`; fact.evidence = lines.slice(index, index + 1 + continuation.length).join('\n'); }
          }
        }
      } else if (!/^\s*(?:pan card|salary slip|pay\s*slip|bank statement|loan application|financial statement)\s*$/i.test(line)) {
        // Common printed labels without punctuation: "Net Salary 50,000".
        for (const [field, pattern] of fieldPatterns) {
          const words = line.trim().split(/\s+/);
          // Prefer the longest label: "PAN Number ..." must not use "Number ..." as its value.
          let split = -1;
          for (let position = 1; position < words.length; position++) {
            if (pattern.test(words.slice(0, position).join(' '))) split = position;
          }
          if (split > 0) { add(field, words.slice(split).join(' '), index + 1, words.slice(0, split).join(' ')); break; }
        }
      }
      for (const match of line.matchAll(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g)) add('pan', match[0], index + 1, 'PAN pattern');
      for (const match of line.matchAll(/(?<!\d)(?:\d{4}[ -]?\d{4}[ -]?\d{4}|[Xx*]{4}[ -]?[Xx*]{4}[ -]?\d{4})(?!\d)/g)) {
        // Avoid interpreting a labeled account number as an Aadhaar number.
        if (!/account|transaction|phone|mobile/i.test(line)) add('aadhaar', match[0], index + 1, 'Aadhaar pattern');
      }
    });
    return facts;
  });
}
