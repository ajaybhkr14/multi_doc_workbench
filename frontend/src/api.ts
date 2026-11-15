export async function request<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, options);
  } catch {
    throw new Error('Cannot reach the server. Check your connection and make sure the backend is running.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `The server returned an error (${response.status}). Please try again.`);
  }
  if (!body) throw new Error('The server returned an empty or invalid response. Please try again.');
  return body as T;
}
