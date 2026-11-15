export async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`/api/${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body as T;
}

export interface UploadResult {
  documents: { id?: string; name: string; status: 'uploaded' | 'failed'; error?: string }[];
}
