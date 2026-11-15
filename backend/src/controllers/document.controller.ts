import type { Request, Response } from 'express';
import { uploadDocument } from '../services/document.service';
import { HttpError } from '../middleware/error-handler';
import type { UploadedFile } from '../types/upload';

export async function uploadDocuments(request: Request, response: Response): Promise<void> {
  const files = request.files as UploadedFile[] | undefined;
  if (!files?.length) throw new HttpError(400, 'Select at least one document.');

  // Each file succeeds or fails independently of the other uploaded files.
  const documents = [];
  for (const file of files) {
    try {
      documents.push({ status: 'uploaded', ...await uploadDocument(file) });
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(error);
      documents.push({
        status: 'failed',
        name: file.originalname,
        code: error instanceof HttpError ? error.code : 'DOCUMENT_SAVE_FAILED',
        statusCode: error instanceof HttpError ? error.status : 500,
        error: error instanceof HttpError ? error.message : 'Could not save this document.',
      });
    } finally {
      file.buffer = Buffer.alloc(0);
    }
  }
  response.status(200).json({ documents });
}
