import { NextRequest, NextResponse } from 'next/server';
import { clientIp, parseWalkthroughLead } from '@/lib/marketing/leadPayload';
import { consumeRateLimit } from '@/lib/marketing/rateLimit';
import { saveProspectLead } from '@/lib/marketing/saveLead';

export const dynamic = 'force-dynamic';

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
    await saveProspectLead(parsed.value, ip);
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
