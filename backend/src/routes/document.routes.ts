import { Router } from 'express';
import { documentUpload } from '../middleware/document-upload';
import { HttpError } from '../middleware/error-handler';
import { uploadDocuments } from '../controllers/document.controller';
import { asyncHandler } from '../middleware/async-handler';

export const documentRouter = Router();
documentRouter.post('/', (request, _response, next) => {
  if (!request.is('multipart/form-data')) {
    return next(new HttpError(415, 'Use multipart/form-data with the documents file field.', 'INVALID_CONTENT_TYPE'));
  }
  next();
}, documentUpload, asyncHandler(uploadDocuments));
