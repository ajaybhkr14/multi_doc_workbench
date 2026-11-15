import { useState } from 'react';
import type { AnalysisReport as Report } from '../types';
import { label } from '../format';
import { ComparisonTable } from './ComparisonTable';
import { FinancialSummary } from './FinancialSummary';
import { ExtractedFacts } from './ExtractedFacts';
import { FindingsList } from './FindingsList';

const views = [
  { id: 'comparison', title: 'Document comparison' },
  { id: 'financial', title: 'Financial summary' },
  { id: 'discrepancies', title: 'Discrepancies' },
  { id: 'missing', title: 'Missing information' },
  { id: 'facts', title: 'Extracted facts' },
  { id: 'kyc', title: 'KYC verification' },
];

export function AnalysisReport({ report }: { report: Report }) {
  const [view, setView] = useState('comparison');
  const discrepancies = report.findings.filter((finding) => ['inconsistency', 'numeric_difference', 'invalid_format', 'review_required'].includes(finding.type));
  const missing = report.findings.filter((finding) => ['missing_document', 'missing_field'].includes(finding.type));
  const kycIds = new Set(report.extractedFacts.filter((fact) => ['name', 'address', 'date_of_birth', 'pan', 'aadhaar'].includes(fact.field)).map((fact) => `${fact.documentId}:${fact.lineNumber}`));
  const kyc = report.findings.filter((finding) => {
    if (finding.type === 'missing_document') return /pan|aadhaar|application/.test(finding.description);
    if (finding.type === 'missing_field') return /name|address|date of birth|pan|aadhaar/.test(finding.description);
    return !finding.calculation && finding.evidence.some((source) => kycIds.has(`${source.documentId}:${source.lineNumber}`));
  });

  return (
    <section className="report" aria-labelledby="report-title">
      <div className="section-heading">
        <div><p className="eyebrow">Analysis results</p><h2 id="report-title">Document intelligence report</h2></div>
        <span className="badge">{label(report.mode)} mode</span>
      </div>
      <p className="document-id">Analysis ID: {report.id}</p>
      <p className="hint">Extracted facts are source data. Findings are rule-based conclusions; no AI interpretation was generated.</p>
      <div className="metrics">
        <div><strong>{report.summary.documentCount}</strong><span>Documents</span></div>
        <div><strong>{report.summary.factCount}</strong><span>Extracted facts</span></div>
        <div><strong>{report.summary.inconsistencyCount}</strong><span>Differences / invalid formats</span></div>
        <div><strong>{report.summary.missingDocumentCount + report.summary.missingFieldCount}</strong><span>Missing items</span></div>
      </div>
      <nav className="report-nav" aria-label="Report views">
        {views.map((item) => <button key={item.id} className="secondary" aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.title}</button>)}
      </nav>
      <div className="panel report-content">
        <h3>{views.find((item) => item.id === view)?.title}</h3>
        {view === 'comparison' && <ComparisonTable documents={report.documents} />}
        {view === 'discrepancies' && <FindingsList findings={discrepancies} emptyMessage="No discrepancies were identified by the selected checks. Review the extracted facts and limitations." />}
        {view === 'missing' && <FindingsList findings={missing} emptyMessage="No missing items were identified by the selected checks." />}
        {view === 'kyc' && (
          <>
            <p className="hint">Consistency and format checks only. This does not verify document authenticity.</p>
            <FindingsList
              findings={kyc}
              emptyMessage="No KYC findings are available. Use a KYC instruction and supply PAN, Aadhaar, or application documents."
            />
          </>
        )}
        {view === 'financial' && <FinancialSummary figures={report.financialSummary} />}
        {view === 'facts' && <ExtractedFacts facts={report.extractedFacts} />}
      </div>
      <details className="panel limitations"><summary>Extraction and analysis limitations</summary><ul>{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></details>
    </section>
  );
}
