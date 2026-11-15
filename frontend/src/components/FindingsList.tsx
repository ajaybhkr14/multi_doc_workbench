import type { Finding } from '../types';
import { Evidence } from './Evidence';
import { label, number } from '../format';

export function FindingsList({ findings, emptyMessage }: { findings: Finding[]; emptyMessage: string }) {
  if (findings.length === 0) return <p className="empty">{emptyMessage}</p>;

  return (
    <ul className="findings-list">
      {findings.map((finding) => (
        <li className="finding" key={finding.id}>
          <div className="section-heading">
            <span className={`badge ${finding.type}`}>{label(finding.type)}</span>
            <span className="muted">Rule-based finding</span>
          </div>
          <p>{finding.description}</p>
          <p className="supporting-files">Sources: {[...new Set(finding.evidence.map((source) => source.filename))].join(', ')}</p>
          {finding.calculation && (
            <div className="calculation">
              <span>Left value: <strong>{number(finding.calculation.leftValue)}</strong></span>
              <span>Right value: <strong>{number(finding.calculation.rightValue)}</strong></span>
              <span>Difference: <strong>{number(finding.calculation.difference)}</strong></span>
              <span>Absolute difference: <strong>{number(finding.calculation.absoluteDifference)}</strong></span>
              <span>Change relative to right value: <strong>{finding.calculation.percentageDifference === null ? 'Not available (zero baseline)' : `${number(finding.calculation.percentageDifference)}%`}</strong></span>
              <span>{label(finding.calculation.currency)} · {label(finding.calculation.period)}</span>
              <small>Left and right values follow the first two sources in the evidence.</small>
            </div>
          )}
          <Evidence sources={finding.evidence} />
        </li>
      ))}
    </ul>
  );
}
