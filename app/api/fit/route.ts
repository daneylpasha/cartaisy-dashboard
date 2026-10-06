import { NextRequest, NextResponse } from 'next/server';
import { resolveFitOutcome, type FitAnswers } from '@/lib/marketing/fitCheck';
import { clientIp, parseFitLead, type LeadInput } from '@/lib/marketing/leadPayload';
import { consumeRateLimit } from '@/lib/marketing/rateLimit';

export const dynamic = 'force-dynamic';

type SaveProspect = (lead: LeadInput, ipAddress: string) => Promise<void>;

type FitRouteAdapters = {
  saveProspectLead: SaveProspect;
  resolveOutcome: (answers: FitAnswers) => ReturnType<typeof resolveFitOutcome>;
};

let adaptersForTests: FitRouteAdapters | null = null;

/** Fixture seam for `npm run test:c01`. Production POST leaves this unset. */
export function setFitRouteAdaptersForTests(adapters: FitRouteAdapters | null) {
  adaptersForTests = adapters;
}

async function saveFitLead(lead: LeadInput, ipAddress: string) {
  if (adaptersForTests) return adaptersForTests.saveProspectLead(lead, ipAddress);
  const { saveProspectLead } = await import('@/lib/marketing/saveLead');
  await saveProspectLead(lead, ipAddress);
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  if (!consumeRateLimit(`fit:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 });
  }

  const parsed = parseFitLead(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await saveFitLead(parsed.value, ip);
  } catch (error) {
    console.error('Fit check save failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json(
      { error: 'We could not save this fit check. Try again, or use the contact form.' },
      { status: 503 }
    );
  }

  const result = (adaptersForTests?.resolveOutcome ?? resolveFitOutcome)({
    stage: parsed.value.stage,
    goal: parsed.value.goal,
  });
  return NextResponse.json({ success: true, ...result });
}
