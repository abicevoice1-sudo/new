// Content-type aware response reader for fetch-based API calls.
export async function readApiResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  const text = await res.text().catch(() => '');
  return text ? { error: text.slice(0, 500) } : null;
}