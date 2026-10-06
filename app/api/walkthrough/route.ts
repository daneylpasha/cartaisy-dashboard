import { NextRequest, NextResponse } from 'next/server';
import { clientIp, parseWalkthroughLead, type LeadInput } from '@/lib/marketing/leadPayload';
import { consumeRateLimit } from '@/lib/marketing/rateLimit';

export const dynamic = 'force-dynamic';

type SaveProspect = (lead: LeadInput, ipAddress: string) => Promise<void>;

let saveForTests: SaveProspect | null = null;

/** Fixture seam for `npm run test:c01`. Production POST leaves this unset. */
export function setWalkthroughSaveForTests(save: SaveProspect | null) {
  saveForTests = save;
}

async function saveWalkthroughLead(lead: LeadInput, ipAddress: string) {
  if (saveForTests) return saveForTests(lead, ipAddress);
  const { saveProspectLead } = await import('@/lib/marketing/saveLead');
  await saveProspectLead(lead, ipAddress);
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!consumeRateLimit(`walkthrough:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 });
  }

  const parsed = parseWalkthroughLead(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await saveWalkthroughLead(parsed.value, ip);
  } catch (error) {
    console.error('Walkthrough save failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json(
      { error: 'We could not save this request. Try again, or use the contact form.' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Request received. A person will follow up by email. This did not book a time slot.',
  });
}
