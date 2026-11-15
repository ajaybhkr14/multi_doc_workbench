import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import multer, { MulterError } from 'multer';
import type { RequestHandler } from 'express';
import { uploadConfig } from '../config/upload';
import { validateFileType } from '../services/file-validation.service';
import { HttpError } from './error-handler';
import type { UploadedFile } from '../types/upload';

// A Multer fileSize error aborts the whole batch. This storage caps each file's
// buffer and drains rejected files so the remaining files can still be processed.
const storage: multer.StorageEngine = {
  _handleFile(_request, file, callback) {
    let size = 0;
    let chunks: Buffer[] = [];
    let uploadError: HttpError | undefined;
    try {
      validateFileType(file);
    } catch (error) {
      if (!(error instanceof HttpError)) return callback(error as Error);
      uploadError = error;
    }

    const sink = new Writable({
      write(chunk: Buffer, _encoding, done) {
        size += chunk.length;
        if (size > uploadConfig.maxFileBytes && !uploadError) {
          uploadError = new HttpError(413, 'Each file must be 5 MB or smaller.', 'FILE_TOO_LARGE');
          chunks = [];
        }
        if (!uploadError) chunks.push(chunk);
        done();
      },
    });

    pipeline(file.stream, sink).then(() => {
      const result: Partial<UploadedFile> = {
        size,
        buffer: uploadError ? Buffer.alloc(0) : Buffer.concat(chunks, size),
        uploadError,
      };
      callback(null, result);
    }, (error: Error) => callback(error));
  },
  _removeFile(_request, file, callback) {
    file.buffer = Buffer.alloc(0);
    callback(null);
  },
};

const parseUpload = multer({
  storage,
  limits: { files: uploadConfig.maxFiles, fields: 0, parts: uploadConfig.maxFiles + 1 },
}).array('documents', uploadConfig.maxFiles);

export const documentUpload: RequestHandler = (request, response, next) => {
  parseUpload(request, response, (error: unknown) => {
    if (error && !(error instanceof MulterError) && !(error instanceof HttpError)) {
      next(new HttpError(400, 'Malformed multipart upload. Check the request boundary and file fields.', 'INVALID_MULTIPART'));
      return;
    }
    next(error);
  });
};
