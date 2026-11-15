import { Readable } from 'node:stream';
import type { Request, Response } from 'express';
import { documentUpload } from '../middleware/document-upload';
import { uploadDocuments } from '../controllers/document.controller';

export interface TestFile {
  name: string;
  type: string;
  content: Buffer;
}

interface UploadResult {
  id?: string;
  name: string;
  status: string;
  extractedText?: string;
  code?: string;
  statusCode?: number;
}

export function textFile(name: string, text: string): TestFile {
  return { name, type: 'text/plain', content: Buffer.from(text) };
}

// Send real multipart bytes through Multer without starting an HTTP server.
export async function parseFiles(files: TestFile[]): Promise<Request> {
  const boundary = 'workbench-test-boundary';
  const chunks: Buffer[] = [];

  for (const file of files) {
    chunks.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="documents"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type}\r\n\r\n`,
    ));
    chunks.push(file.content, Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(chunks);
  const request = Readable.from([body]) as unknown as Request;
  request.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`,
    'content-length': String(body.length),
  };

  await new Promise<void>((resolve, reject) => {
    documentUpload(request, {} as Response, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  return request;
}

export async function processFiles(files: TestFile[]) {
  const request = await parseFiles(files);
  let statusCode = 0;
  let documents: UploadResult[] = [];
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: { documents: UploadResult[] }) {
      documents = body.documents;
    },
  } as Response;

  await uploadDocuments(request, response);
  return { statusCode, documents };
}
