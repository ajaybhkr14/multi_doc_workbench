import { useState } from 'react';
import { request } from './api';
import type { AnalysisReport as Report, UploadItem, UploadResponse } from './types';
import { UploadPanel } from './components/UploadPanel';
import { InstructionPanel } from './components/InstructionPanel';
import { AnalysisReport } from './components/AnalysisReport';

function validateFile(file: File): string | undefined {
  if (!/\.(pdf|docx|txt)$/i.test(file.name)) return 'Choose a PDF, DOCX, or TXT file.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > 5 * 1024 * 1024) return 'The file exceeds the 5 MB limit.';
  return undefined;
}

export function App() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [instruction, setInstruction] = useState('');
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'analyzing'>('idle');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const busy = phase !== 'idle';
  const uploaded = files.filter((item) => item.status === 'uploaded' && item.id);

  function selectFiles(selected: File[]) {
    if (files.length + selected.length > 5) {
      setError('You can have up to 5 files. Remove a file before adding more.');
      return;
    }
    const additions: UploadItem[] = selected.map((file) => {
      const validationError = validateFile(file);
      return { key: crypto.randomUUID(), file, status: validationError ? 'invalid' : 'selected', error: validationError };
    });
    setFiles([...files, ...additions]);
    setError('');
    setMessage('');
    setReport(null);
  }

  function removeFile(key: string) {
    setFiles(files.filter((item) => item.key !== key));
    setReport(null);
    setError('');
    setMessage('');
  }

  function changeInstruction(value: string) {
    setInstruction(value);
    setReport(null);
    setMessage('');
    setError('');
  }

  async function uploadFiles() {
    const pending = files.filter((item) => item.status === 'selected' || item.status === 'failed');
    if (busy || pending.length === 0) return;
    const pendingKeys = new Set(pending.map((item) => item.key));
    setPhase('uploading');
    setError('');
    setReport(null);
    setMessage('Uploading documents and extracting text…');
    setFiles(files.map((item) => pendingKeys.has(item.key) ? { ...item, status: 'uploading', error: undefined } : item));
    try {
      const data = new FormData();
      pending.forEach((item) => data.append('documents', item.file));
      const response = await request<UploadResponse>('documents', { method: 'POST', body: data });
      const updates = new Map<string, UploadItem>();
      pending.forEach((item, index) => {
        const result = response.documents[index];
        if (result?.status === 'uploaded' && result.id) {
          updates.set(item.key, { ...item, status: 'uploaded', id: result.id, error: undefined });
        } else {
          updates.set(item.key, { ...item, status: 'failed', error: result?.error || 'This file could not be processed.' });
        }
      });
      setFiles(files.map((item) => updates.get(item.key) || item));
      const succeeded = [...updates.values()].filter((item) => item.status === 'uploaded').length;
      setMessage(`${succeeded} of ${pending.length} files uploaded. ${succeeded < pending.length ? 'Review the per-file errors below.' : 'Ready to analyze.'}`);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setFiles(files.map((item) => pendingKeys.has(item.key) ? { ...item, status: 'failed', error: text } : item));
      setError(text);
      setMessage('');
    } finally {
      setPhase('idle');
    }
  }

  async function analyzeFiles() {
    if (busy || !uploaded.length || !instruction.trim()) return;
    setPhase('analyzing');
    setError('');
    setReport(null);
    setMessage('Checking facts and comparing documents…');
    try {
      const result = await request<Report>('analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: uploaded.map((item) => item.id), instruction: instruction.trim() }),
      });
      setReport(result);
      setMessage('Analysis complete. Your report is available below.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
      setMessage('');
    } finally {
      setPhase('idle');
    }
  }

  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Banking intelligence workbench</p>
        <h1>Bring your documents into focus.</h1>
        <p>Compare customer details, verify financial figures, and trace every finding to its source.</p>
      </header>
      <div className="status-area" aria-live="polite" aria-atomic="true">
        {message && <p className="notice" role="status">{busy && <span className="spinner" aria-hidden="true" />}{message}</p>}
      </div>
      {error && <p className="error-banner" role="alert">{error}</p>}
      <div className="workspace" aria-busy={busy}>
        <UploadPanel
          files={files}
          busy={busy}
          uploading={phase === 'uploading'}
          onSelect={selectFiles}
          onRemove={removeFile}
          onUpload={uploadFiles}
        />
        <InstructionPanel
          instruction={instruction}
          busy={busy}
          analyzing={phase === 'analyzing'}
          uploadedCount={uploaded.length}
          onChange={changeInstruction}
          onAnalyze={analyzeFiles}
        />
      </div>
      {report ? (
        <AnalysisReport key={report.id} report={report} />
      ) : (
        <section className="report-placeholder">
          <h2>Your structured report will appear here</h2>
          <p>Upload documents, enter an instruction, then run an analysis to view comparisons, findings, missing information, and source evidence.</p>
        </section>
      )}
    </main>
  );
}
