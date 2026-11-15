import './style.css';
import { request, type UploadResult } from './api';

const form = document.querySelector<HTMLFormElement>('#analysis-form')!;
const files = document.querySelector<HTMLInputElement>('#documents')!;
const instruction = document.querySelector<HTMLTextAreaElement>('#instruction')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const result = document.querySelector<HTMLPreElement>('#result')!;
const button = form.querySelector<HTMLButtonElement>('button')!;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  result.textContent = '';
  if ((files.files?.length || 0) > 5) {
    status.textContent = 'Select no more than 5 documents.';
    button.disabled = false;
    return;
  }
  status.textContent = 'Uploading documents…';
  try {
    const data = new FormData();
    for (const file of files.files || []) data.append('documents', file);
    const uploads = await request<UploadResult>('documents', { method: 'POST', body: data });
    result.textContent = JSON.stringify(uploads, null, 2);
    const documentIds = uploads.documents.flatMap((document) => document.id ? [document.id] : []);
    if (!documentIds.length) throw new Error('No documents were uploaded successfully. See individual errors below.');
    status.textContent = 'Analyzing documents…';
    const analysis = await request<unknown>('analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds, instruction: instruction.value }),
    });
    result.textContent = JSON.stringify({ uploads, analysis }, null, 2);
    status.textContent = 'Analysis complete.';
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'An error occurred.';
  } finally {
    button.disabled = false;
  }
});
