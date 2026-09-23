import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth/server';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

type BackendCollection = {
  id?: unknown;
  title?: unknown;
  handle?: unknown;
  image?: { src?: unknown } | null;
  productsCount?: unknown;
};

/**
 * The backend returns Shopify GIDs. Home modules already store the numeric
 * collection id from the old REST payload, so keep that id shape.
 */
function collectionId(raw: unknown): string {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw !== 'string') {
    return '';
  }
  const trimmed = raw.trim();
  const gid = trimmed.match(/\/(\d+)$/);
  if (gid) {
    return gid[1];
  }
  return trimmed;
}

function normalizeCollection(raw: BackendCollection) {
  const id = collectionId(raw.id);
  const imageSrc = typeof raw.image?.src === 'string' ? raw.image.src : null;
  const productsCount =
    typeof raw.productsCount === 'number' && Number.isFinite(raw.productsCount)
      ? raw.productsCount
      : 0;

  return {
    id,
    numericId: /^\d+$/.test(id) ? Number(id) : undefined,
    title: typeof raw.title === 'string' ? raw.title : '',
    handle: typeof raw.handle === 'string' ? raw.handle : '',
    image: imageSrc ? { src: imageSrc } : null,
    productsCount,
  };
}

/**
 * Collections are read with the backend store token.
 * This route does not read `shopify.accessToken` from the dashboard database.
 */
export async function GET() {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: 'Sign in again to load your collections.' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_URL}/shopify/collections`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const body = (await response.json().catch(() => null)) as
      | { data?: { collections?: BackendCollection[] }; error?: unknown }
      | null;

    if (!response.ok) {
      const notConnected = response.status === 400 || response.status === 409;
      return NextResponse.json(
        {
          error: notConnected
            ? 'Connect your Shopify store to see collections.'
            : "We couldn't load your collections. Try again.",
        },
        { status: notConnected ? 400 : response.status }
      );
    }

    const collections = Array.isArray(body?.data?.collections)
      ? body.data.collections.map(normalizeCollection).filter((collection) => collection.id)
      : [];

    return NextResponse.json({
      data: { collections },
    });
  } catch (error) {
    console.error('Shopify collections proxy error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      { error: "We couldn't load your collections. Try again." },
      { status: 502 }
    );
  }
}
