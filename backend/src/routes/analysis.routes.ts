import { Router } from 'express';
import { createAnalysis } from '../controllers/analysis.controller';
import { asyncHandler } from '../middleware/async-handler';

export const analysisRouter = Router();
analysisRouter.post('/', asyncHandler(createAnalysis));
