export interface Document {
  id: string;
  name: string;
  text: string;
}

export interface ExtractedFact {
  documentId: string;
  documentName: string;
  filename: string;
  field: string;
  value: string;
  evidence: string;
  lineNumber: number;
  sourceLabel: string;
}
