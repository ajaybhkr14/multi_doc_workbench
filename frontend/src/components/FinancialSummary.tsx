import type { AnalysisReport } from '../types';
import { label, number } from '../format';
import { Evidence } from './Evidence';

export function FinancialSummary({ figures }: { figures: AnalysisReport['financialSummary'] }) {
  if (figures.length === 0) {
    return <p className="empty">No financial figures were extracted for these checks.</p>;
  }

  return (
    <>
      <p className="hint">Figures are grouped by source. Amounts across supporting documents are not added together.</p>
      <div className="table-scroll" tabIndex={0} aria-label="Financial summary">
        <table>
          <caption>Key financial data by document</caption>
          <thead>
            <tr>
              <th scope="col">Document</th>
              <th scope="col">Field</th>
              <th scope="col">Amount</th>
              <th scope="col">Currency / frequency</th>
              <th scope="col">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {figures.map((figure, index) => (
              <tr key={index}>
                <td>{figure.filename}<span className="document-id">{figure.documentId}</span></td>
                <td>{label(figure.field)}</td>
                <td>{number(figure.amount)}<small>Source: {figure.rawValue}</small></td>
                <td>{label(figure.currency)} / {label(figure.period)}</td>
                <td><Evidence sources={[figure.evidence]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
