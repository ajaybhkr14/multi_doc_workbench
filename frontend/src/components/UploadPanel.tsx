import type { ChangeEvent } from 'react';
import type { UploadItem } from '../types';
import { label } from '../format';

interface Props {
  files: UploadItem[];
  busy: boolean;
  uploading: boolean;
  onSelect: (files: File[]) => void;
  onRemove: (key: string) => void;
  onUpload: () => void;
}

export function UploadPanel({ files, busy, uploading, onSelect, onRemove, onUpload }: Props) {
  const pending = files.filter((item) => item.status === 'selected' || item.status === 'failed');

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    onSelect(Array.from(event.target.files || []));
    event.target.value = '';
  }

  return (
    <section className="panel" aria-labelledby="upload-title">
      <div className="section-heading">
        <h2 id="upload-title">1. Add documents</h2>
        <span className="muted">{files.length} / 5 files</span>
      </div>
      <label className="file-picker" htmlFor="documents">
        <strong>Choose financial and supporting documents</strong>
        <span>PDF, DOCX, or UTF-8 TXT · Up to 5 files · 5 MB each</span>
        <input id="documents" type="file" multiple accept=".pdf,.docx,.txt" onChange={selectFiles} disabled={busy} aria-describedby="file-help" />
      </label>
      <p id="file-help" className="hint">Each file is processed independently. Scanned documents require OCR and are not supported yet.</p>

      {files.length === 0 && <p className="empty">No documents selected.</p>}
      <ul className="file-list">
        {files.map((item) => (
          <li key={item.key} className="file-row">
            <div className="file-info">
              <strong>{item.file.name}</strong>
              <span className="muted">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
              {item.id && <span className="document-id">ID: {item.id}</span>}
              {item.error && <span className="error-text">{item.error}</span>}
            </div>
            <span className={`badge ${item.status}`}>{label(item.status)}</span>
            <button className="text-button" onClick={() => onRemove(item.key)} disabled={busy} aria-label={`Remove ${item.file.name}`}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={onUpload} disabled={busy || pending.length === 0}>
        {uploading ? 'Uploading and extracting text…' : `Upload ${pending.length || ''} ${pending.length === 1 ? 'file' : 'files'}`}
      </button>
    </section>
  );
}
