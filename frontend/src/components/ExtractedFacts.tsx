import type { ExtractedFact } from '../types';
import { label } from '../format';

export function ExtractedFacts({ facts }: { facts: ExtractedFact[] }) {
  if (facts.length === 0) return <p className="empty">No supported fields were extracted.</p>;

  return (
    <div className="table-scroll" tabIndex={0} aria-label="Extracted facts">
      <table>
        <caption>Facts extracted directly from document text</caption>
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Value</th>
            <th scope="col">Source document</th>
            <th scope="col">Source text</th>
          </tr>
        </thead>
        <tbody>
          {facts.map((fact, index) => (
            <tr key={index}>
              <td>{label(fact.field)}</td>
              <td>{fact.value}</td>
              <td>
                {fact.filename}
                <span className="document-id">{fact.documentId}</span>
                <small>Line {fact.lineNumber}</small>
              </td>
              <td className="source-text">{fact.evidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
