import { randomUUID } from 'node:crypto';
import type { AnalyzedDocument, Finding, DocumentEvidence } from '../types/analysis';
import type { ExtractedFact } from '../types/document';
import { calculateDifference, parseMoney } from './numeric-comparison.service';

export function checkNumericFacts(documents: AnalyzedDocument[], scope: { income: boolean; loan: boolean; bank: boolean; financial: boolean }) {
  const findings: Finding[] = [];
  const fields = new Set<string>();
  if (scope.income || scope.loan) ['income', 'declared_income', 'net_salary', 'gross_salary', 'salary_credit'].forEach((field) => fields.add(field));
  if (scope.loan) ['loan_amount', 'outstanding_loan'].forEach((field) => fields.add(field));
  if (scope.bank) ['balance', 'opening_balance', 'transaction_amount', 'salary_credit'].forEach((field) => fields.add(field));
  if (scope.financial) ['revenue', 'assets', 'liabilities', 'outstanding_loan'].forEach((field) => fields.add(field));
  const facts = documents.flatMap((document) => document.facts).filter((fact) => fields.has(fact.field));
  const context = (fact: ExtractedFact) => documents.find((document) => document.documentId === fact.documentId)!;
  const source = (fact: ExtractedFact): DocumentEvidence => ({ ...fact, documentType: context(fact).documentType });
  const category = (fact: ExtractedFact) => ['income', 'declared_income', 'net_salary', 'salary_credit'].includes(fact.field) ? 'income' : fact.field;
  const normalize = (value: string) => value.toLowerCase().replace(/\W/g, '');
  const fieldValue = (fact: ExtractedFact, field: string) => context(fact).facts.find((item) => item.field === field)?.value;
  const pairEvidence = (left: ExtractedFact, right: ExtractedFact) => [source(left), source(right),
    ...[left, right].flatMap((fact) => context(fact).facts.filter((item) => ['period', 'currency', 'company_name'].includes(item.field)).map(source))];
  const add = (type: Finding['type'], description: string, evidence: DocumentEvidence[], calculation?: Finding['calculation']) => {
    findings.push({ id: randomUUID(), origin: 'rule_based', type, description, evidence, ...(calculation ? { calculation } : {}) });
  };
  for (const fact of facts) {
    if (!parseMoney(fact, context(fact).facts)) add('review_required', `Could not parse ${fact.field} as a supported numeric amount.`, [source(fact)]);
  }
  // Present figures by source. Adding amounts across overlapping documents would double-count them.
  const financialSummary = facts.flatMap((fact) => {
    const money = parseMoney(fact, context(fact).facts);
    return money ? [{ documentId: fact.documentId, filename: fact.filename, field: fact.field,
      rawValue: fact.value, ...money, evidence: source(fact) }] : [];
  });
  for (let index = 0; index < facts.length; index++) {
    const left = facts[index];
    for (const right of facts.slice(index + 1)) {
      if (left.documentId === right.documentId || category(left) !== category(right) || left.field === 'transaction_amount') continue;
      const leftMoney = parseMoney(left, context(left).facts), rightMoney = parseMoney(right, context(right).facts);
      if (!leftMoney || !rightMoney) continue;
      const leftPeriod = fieldValue(left, 'period'), rightPeriod = fieldValue(right, 'period');
      const leftCompany = fieldValue(left, 'company_name'), rightCompany = fieldValue(right, 'company_name');
      const differentCompany = !!(leftCompany && rightCompany && normalize(leftCompany) !== normalize(rightCompany));
      if (leftMoney.currency !== rightMoney.currency ||
          (leftMoney.period !== rightMoney.period && (leftMoney.period === 'unspecified' || rightMoney.period === 'unspecified')) ||
          (leftPeriod && rightPeriod && normalize(leftPeriod) !== normalize(rightPeriod))) {
        add('review_required', `Cannot directly compare ${category(left)}: currency or reporting-period context differs or is incomplete.`, pairEvidence(left, right));
        continue;
      }
      const calculation = calculateDifference(leftMoney, rightMoney);
      const uncertain = leftMoney.currency === 'UNSPECIFIED' || !leftPeriod || !rightPeriod || leftMoney.period === 'unspecified';
      add(calculation.absoluteDifference === 0 ? 'match' : differentCompany ? 'review_required' : 'numeric_difference',
        `${category(left)} ${calculation.absoluteDifference === 0 ? 'values agree' : `differs by ${calculation.absoluteDifference}`} between ${left.documentName} and ${right.documentName}.${differentCompany ? ' Different companies: this is a comparison, not an inconsistency.' : ''}${uncertain ? ' Currency or period context is unspecified; comparability requires review.' : ''}`,
        pairEvidence(left, right), calculation);
    }
  }
  return { findings, financialSummary };
}
