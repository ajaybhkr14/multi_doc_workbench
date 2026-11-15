import path from 'node:path';
import { documentMimeTypes, uploadConfig } from '../config/upload';
import { HttpError } from '../middleware/error-handler';

export function validateFileType(file: Pick<Express.Multer.File, 'originalname' | 'mimetype'>): string {
  if (!file.originalname || file.originalname.length > 255 || /[\x00-\x1f\x7f\\/]/.test(file.originalname)) {
    throw new HttpError(400, 'Provide a valid filename of at most 255 characters.', 'INVALID_FILENAME');
  }
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMimeType = documentMimeTypes[extension];
  if (!expectedMimeType) {
    throw new HttpError(415, 'Supported file types are PDF, DOCX, and TXT.', 'UNSUPPORTED_FILE_TYPE');
  }
  if (file.mimetype.toLowerCase() !== expectedMimeType) {
    throw new HttpError(415, 'The MIME type does not match the file extension.', 'MIME_TYPE_MISMATCH');
  }
  return extension;
}

export function validateFileContent(file: Express.Multer.File, extension: string): void {
  if (file.size > uploadConfig.maxFileBytes) {
    throw new HttpError(413, 'Each file must be 5 MB or smaller.', 'FILE_TOO_LARGE');
  }
  if (!file.buffer.length) {
    throw new HttpError(422, 'The file is empty.', 'EMPTY_FILE');
  }
  if (extension === '.pdf' && !/^%PDF-\d\.\d/.test(file.buffer.subarray(0, 8).toString('ascii'))) {
    throw new HttpError(422, 'File content is not a PDF document.', 'INVALID_FILE_CONTENT');
  }
  if (extension === '.docx' && !file.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) {
    throw new HttpError(422, 'File content is not a DOCX archive.', 'INVALID_FILE_CONTENT');
  }
}
