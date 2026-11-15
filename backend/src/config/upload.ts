export const uploadConfig = {
  maxFiles: 5,
  maxFileBytes: 5 * 1024 * 1024,
  maxExtractedCharacters: 2_000_000,
  maxDocxEntries: 2000,
  maxDocxExpandedBytes: 25 * 1024 * 1024,
};

export const documentMimeTypes: Record<string, string> = {
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
