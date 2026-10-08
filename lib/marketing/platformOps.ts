const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

/**
 * Platform-operator gate already enforced by the backend build-request list.
 * The response body can contain other stores' notes, so it is discarded.
 */
export async function isPlatformOperator(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/admin/build-requests`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    await response.arrayBuffer().catch(() => undefined);
    return response.status === 200;
  } catch {
    return false;
  }
}
