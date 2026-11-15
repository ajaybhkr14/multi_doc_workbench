import { fromBuffer } from 'yauzl';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { uploadConfig } from '../config/upload';
import { HttpError } from '../middleware/error-handler';

// Inspect the ZIP directory before decompression to reject unrelated archives,
// encrypted entries, and excessive expanded sizes.
export function validateDocxArchive(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true }, (error, zip) => {
      const invalid = () => new HttpError(422, 'The DOCX archive is invalid or unsafe.', 'INVALID_FILE_CONTENT');
      if (error || !zip) return reject(invalid());
      let entries = 0;
      let expandedBytes = 0;
      let actualBytes = 0;
      const names = new Set<string>();
      const fail = () => { zip.close(); reject(invalid()); };

      zip.on('error', fail);
      zip.on('entry', (entry) => {
        entries++;
        expandedBytes += entry.uncompressedSize;
        if (entries > uploadConfig.maxDocxEntries || expandedBytes > uploadConfig.maxDocxExpandedBytes ||
            (entry.generalPurposeBitFlag & 1) !== 0 || names.has(entry.fileName)) {
          fail();
          return;
        }
        names.add(entry.fileName);
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) return fail();
          const sink = new Writable({
            write(chunk: Buffer, _encoding, done) {
              actualBytes += chunk.length;
              done(actualBytes > uploadConfig.maxDocxExpandedBytes ? invalid() : undefined);
            },
          });
          pipeline(stream, sink).then(() => zip.readEntry(), fail);
        });
      });
      zip.on('end', () => {
        if (!names.has('[Content_Types].xml') || !names.has('_rels/.rels') || !names.has('word/document.xml')) {
          reject(invalid());
        } else {
          resolve();
        }
      });
      zip.readEntry();
    });
  });
}
