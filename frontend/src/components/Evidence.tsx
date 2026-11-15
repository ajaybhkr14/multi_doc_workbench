import type { DocumentEvidence } from '../types';

export function Evidence({ sources }: { sources: DocumentEvidence[] }) {
  return (
    <details className="evidence">
      <summary>Supporting evidence ({sources.length})</summary>
      {sources.map((source, index) => (
        <div className="source" key={`${source.documentId}-${source.lineNumber}-${index}`}>
          <strong>{source.filename}</strong>
          <span className="document-id">Document ID: {source.documentId}{source.lineNumber !== null ? ` · Line ${source.lineNumber}` : ' · Document inventory'}</span>
          <blockquote>{source.evidence}</blockquote>
        </div>
      ))}
    </details>
  );
}
