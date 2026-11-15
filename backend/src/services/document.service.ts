import { randomUUID } from 'node:crypto';
import { saveDocument } from '../db/repositories/document.repository';
import { extractFacts } from './fact-extraction.service';
import { validateFileContent, validateFileType } from './file-validation.service';
import { extractDocumentText } from './text-extraction.service';
import type { UploadedFile } from '../types/upload';

export async function uploadDocument(file: UploadedFile) {
  if (file.uploadError) throw file.uploadError;
  const extension = validateFileType(file);
  validateFileContent(file, extension);
  const text = await extractDocumentText(file.buffer, extension);
  const document = { id: randomUUID(), name: file.originalname, text };
  await saveDocument(document, file.mimetype || 'text/plain', extractFacts([document]));
  return { id: document.id, name: document.name, mimeType: file.mimetype, extractedText: text };
}
