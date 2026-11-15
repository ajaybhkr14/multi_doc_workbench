import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { uploadConfig } from '../config/upload';
import { HttpError } from '../middleware/error-handler';
import { validateDocxArchive } from './docx-validation.service';

function extractPlainText(buffer: Buffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    throw new HttpError(422, 'TXT files must use valid UTF-8 encoding.', 'INVALID_TEXT_ENCODING');
  }
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text) ||
      /^\s*(?:%PDF-|PK\x03\x04|\{\\rtf|<!doctype\s+html|<html\b)/i.test(text)) {
    throw new HttpError(422, 'The TXT file contains binary or non-plain-text content.', 'INVALID_FILE_CONTENT');
  }
  return text;
}

export async function extractDocumentText(buffer: Buffer, extension: string): Promise<string> {
  let text: string;
  try {
    if (extension === '.txt') {
      text = extractPlainText(buffer);
    } else if (extension === '.pdf') {
      const parser = new PDFParse({ data: buffer, isEvalSupported: false });
      try {
        // Disable generated page labels so image-only PDFs remain empty.
        text = (await parser.getText({ pageJoiner: '' })).text;
      } finally {
        await parser.destroy();
      }
    } else {
      await validateDocxArchive(buffer);
      text = (await mammoth.extractRawText({ buffer })).value;
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(422, 'Cannot extract text. The document may be corrupt, encrypted, or unsupported.', 'TEXT_EXTRACTION_FAILED');
  }
  text = text.replace(/\r\n?/g, '\n').trim();
  if (!text) {
    throw new HttpError(422, 'No readable text was found. Scanned documents require OCR, which is not supported yet.', 'NO_EXTRACTABLE_TEXT');
  }
  if (text.length > uploadConfig.maxExtractedCharacters) {
    throw new HttpError(422, 'The document contains too much extracted text.', 'EXTRACTED_TEXT_TOO_LARGE');
  }
  return text;
}
