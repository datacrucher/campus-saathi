export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** JSON request to the Campus Saathi API. Throws ApiError with the server's message on failure. */
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      credentials: 'same-origin',
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Campus Saathi can’t be reached right now. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong. Please try again.');
  return data as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');
