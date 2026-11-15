import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import documentRepository = require('../db/repositories/document.repository');
import analysisRepository = require('../db/repositories/analysis.repository');
import { env } from '../config/env';
import { uploadConfig } from '../config/upload';
import { analyzeDocuments } from '../services/analysis.service';
import { analyzeMock } from '../services/mock-analysis.service';
import { parseFiles, processFiles, textFile } from './upload-helper';

test('uploads PDF and TXT files independently and saves their extracted facts', async (context) => {
  const save = context.mock.method(documentRepository, 'saveDocument', async () => {});
  const pdf = await readFile(path.resolve(__dirname, '../../../sample-documents/01-pan-card.pdf'));

  const result = await processFiles([
    { name: 'pan.pdf', type: 'application/pdf', content: pdf },
    textFile('salary-slip.txt', 'Salary Slip\nName: Rohan Mehta\nNet Monthly Salary: INR 50,000'),
  ]);

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.documents.map((file) => file.status), ['uploaded', 'uploaded']);
  assert.notEqual(result.documents[0].id, result.documents[1].id);
  assert.match(result.documents[0].extractedText!, /PAN Number: DEMOP1234X/);
  assert.match(result.documents[1].extractedText!, /Net Monthly Salary: INR 50,000/);
  assert.equal(save.mock.callCount(), 2);

  const facts = save.mock.calls[1].arguments[2];
  assert(facts);
  assert(facts.some((fact) => fact.field === 'net_salary' && fact.value === 'INR 50,000'));
  assert(facts.every((fact) => fact.documentId === result.documents[1].id));
});

test('enforces five files and 5 MB while isolating invalid files in a batch', async (context) => {
  const save = context.mock.method(documentRepository, 'saveDocument', async () => {});
  const exactSize = Buffer.alloc(uploadConfig.maxFileBytes, ' ');
  Buffer.from('Name: Rohan Mehta').copy(exactSize);

  const result = await processFiles([
    { name: 'valid.txt', type: 'text/plain', content: exactSize },
    { name: 'oversized.txt', type: 'text/plain', content: Buffer.alloc(uploadConfig.maxFileBytes + 1) },
    { name: 'statement.csv', type: 'text/csv', content: Buffer.from('name,income\nRohan,50000') },
    { name: 'fake.pdf', type: 'application/pdf', content: Buffer.from('This is not a PDF') },
    { name: 'wrong-mime.txt', type: 'application/pdf', content: Buffer.from('Name: Rohan') },
  ]);

  assert.equal(result.documents[0].status, 'uploaded');
  assert.deepEqual(result.documents.slice(1).map((file) => file.code), [
    'FILE_TOO_LARGE', 'UNSUPPORTED_FILE_TYPE', 'INVALID_FILE_CONTENT', 'MIME_TYPE_MISMATCH',
  ]);
  assert.equal(result.documents[1].statusCode, 413);
  assert.equal(save.mock.callCount(), 1);

  const sixFiles = Array.from({ length: 6 }, (_, index) => textFile(`${index}.txt`, 'Name: Rohan'));
  await assert.rejects(parseFiles(sixFiles), { code: 'LIMIT_FILE_COUNT' });
});

test('mock analysis calculates income differences and saves findings with evidence', async (context) => {
  const previousKey = env.apiKey;
  env.apiKey = '';
  context.after(() => { env.apiKey = previousKey; });
  context.mock.method(console, 'info', () => {});
  context.mock.method(documentRepository, 'findDocuments', async () => [
    { id: 'application-id', name: 'application.txt', text: 'Loan Application\nDeclared Annual Income: INR 7.2 lakh' },
    { id: 'salary-id', name: 'salary-slip.txt', text: 'Salary Slip\nNet Monthly Salary: INR 50,000\nGross Monthly Salary: INR 75,000' },
  ]);
  const create = context.mock.method(analysisRepository, 'createAnalysis', async () => {});
  const complete = context.mock.method(analysisRepository, 'completeAnalysis', async () => {});

  const report = await analyzeDocuments(['application-id', 'salary-id'], 'Compare salary and declared income');
  const difference = report.findings.find((finding) => finding.type === 'numeric_difference');

  assert.equal(report.mode, 'mock');
  assert.equal(report.aiInterpretation, null);
  assert.equal(report.status, 'completed');
  assert(difference?.calculation);
  assert.equal(difference.calculation.leftValue, 60000);
  assert.equal(difference.calculation.rightValue, 50000);
  assert.equal(difference.calculation.absoluteDifference, 10000);
  assert.equal(difference.calculation.percentageDifference, 20);
  assert.equal(difference.calculation.period, 'monthly');
  assert.deepEqual(difference.evidence.slice(0, 2).map((source) => source.documentId), ['application-id', 'salary-id']);
  assert.equal(create.mock.callCount(), 1);
  assert.equal(complete.mock.calls[0].arguments[0], report.id);
  assert.deepEqual(complete.mock.calls[0].arguments[3], report.findings);
});

test('KYC analysis reports identity mismatches and missing information with source references', () => {
  const report = analyzeMock([
    { id: 'pan-id', name: 'pan.txt', text: 'PAN Card\nName: Rohan Mehta\nDOB: 15/05/1990\nPAN: DEMOP1234X' },
    { id: 'aadhaar-id', name: 'aadhaar.txt', text: 'Aadhaar\nName: Rohan Kumar Mehta\nDOB: 16/05/1990\nAadhaar: XXXX XXXX 9012' },
  ], 'Verify KYC and income; highlight missing documents and information');

  assert(report.findings.some((finding) => finding.type === 'inconsistency' && finding.description.includes('name')));
  assert(report.findings.some((finding) => finding.type === 'inconsistency' && finding.description.includes('date of birth')));
  assert(report.findings.some((finding) => finding.type === 'missing_field' && finding.description.includes('address')));
  assert(report.findings.some((finding) => finding.type === 'missing_document' && finding.description.includes('salary slip')));
  assert(report.findings.some((finding) => finding.type === 'missing_document' && finding.description.includes('bank statement')));

  for (const finding of report.findings) {
    assert.equal(finding.origin, 'rule_based');
    assert(finding.evidence.length > 0);
    for (const source of finding.evidence) {
      assert(['pan-id', 'aadhaar-id'].includes(source.documentId));
      assert(source.filename);
      assert(source.evidence);
      if (source.field) assert(source.lineNumber! > 0);
    }
  }
});
