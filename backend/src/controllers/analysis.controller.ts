import type { Request, Response } from 'express';
import { analyzeDocuments } from '../services/analysis.service';
import { HttpError } from '../middleware/error-handler';
import { uploadConfig } from '../config/upload';

export async function createAnalysis(request: Request, response: Response): Promise<void> {
  const { documentIds, instruction } = request.body ?? {};
  if (!Array.isArray(documentIds) || !documentIds.length || documentIds.length > uploadConfig.maxFiles ||
      documentIds.some((id) => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) ||
      typeof instruction !== 'string' || !instruction.trim() || instruction.length > 5000) {
    throw new HttpError(400, `Provide 1–${uploadConfig.maxFiles} valid document IDs and an instruction of 1–5000 characters.`);
  }
  response.json(await analyzeDocuments(documentIds, instruction.trim()));
}
