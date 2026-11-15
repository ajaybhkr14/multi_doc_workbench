import express from 'express';
import { documentRouter } from './routes/document.routes';
import { analysisRouter } from './routes/analysis.routes';
import { errorHandler } from './middleware/error-handler';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use('/api/documents', documentRouter);
app.use('/api/analysis', analysisRouter);
app.use((_request, response) => { response.status(404).json({ error: 'Route not found.' }); });
app.use(errorHandler);
