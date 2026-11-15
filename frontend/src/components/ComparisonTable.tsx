import type { AnalyzedDocument } from '../types';
import { label } from '../format';

export function ComparisonTable({ documents }: { documents: AnalyzedDocument[] }) {
  const fields = [...new Set(documents.flatMap((document) => document.facts.map((fact) => fact.field)))];
  if (!fields.length) return <p className="empty">No supported fields were extracted. Check the missing-information report.</p>;

  return (
    <div className="table-scroll" tabIndex={0} aria-label="Document comparison table">
      <table>
        <caption>Extracted values by field and source document</caption>
        <thead>
          <tr>
            <th scope="col">Field</th>
            {documents.map((document) => (
              <th scope="col" key={document.documentId}>
                {document.filename}
                <small>{label(document.documentType)}</small>
                <span className="document-id">{document.documentId}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{fields.map((field) => (
          <tr key={field}>
            <th scope="row">{label(field)}</th>
            {documents.map((document) => {
              const facts = document.facts.filter((fact) => fact.field === field);
              return (
                <td key={document.documentId}>
                  {facts.length ? facts.map((fact, index) => (
                    <div className="table-value" key={index}>
                      {fact.value}
                      <small>Line {fact.lineNumber}</small>
                    </div>
                  )) : <span className="muted">Not extracted</span>}
                </td>
              );
            })}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
