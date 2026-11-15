import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { uploadConfig } from '../config/upload';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'INVALID_REQUEST') {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Each file must be 5 MB or smaller.',
      LIMIT_FILE_COUNT: `Upload no more than ${uploadConfig.maxFiles} files per request.`,
      LIMIT_UNEXPECTED_FILE: `Use the documents field and upload no more than ${uploadConfig.maxFiles} files.`,
      LIMIT_FIELD_COUNT: 'Only document file fields are allowed.',
      LIMIT_PART_COUNT: 'Too many multipart fields.',
    };
    response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      code: error.code,
      error: messages[error.code] || 'Invalid multipart upload.',
    });
    return;
  }
  const status = error instanceof HttpError ? error.status
    : error instanceof MulterError || error instanceof SyntaxError ? 400 : 500;
  if (status === 500) console.error(error);
  response.status(status).json({
    code: error instanceof HttpError ? error.code : status === 400 ? 'INVALID_REQUEST' : 'INTERNAL_ERROR',
    error: status === 500 ? 'An internal error occurred.' : error.message,
  });
};
