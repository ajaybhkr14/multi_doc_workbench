import type { HttpError } from '../middleware/error-handler';

export interface UploadedFile extends Express.Multer.File {
  uploadError?: HttpError;
}
