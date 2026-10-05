import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getServerSession } from '@/lib/auth/server';
import { leadInboxAccess, mergeOperatorLeads } from '@/lib/marketing/leadInbox';
import { isPlatformOperator } from '@/lib/marketing/platformOps';
import { connectToDatabase } from '@/lib/db';
import { ContactSubmission } from '@/models/ContactSubmission';
import { ProspectLead } from '@/models/ProspectLead';

export const dynamic = 'force-dynamic';

const LEAD_SELECT =
  'kind name email storeUrl stage goal outcome outcomeTitle note preferredWindow createdAt';
const CONTACT_SELECT = 'name email subject message createdAt';

export async function GET(request: NextRequest) {
  const session = await getServerSession(undefined, request);
  const token = await getAuthToken(request);
  if (!session || !token) {
    const denied = leadInboxAccess({ hasSession: Boolean(session), hasToken: Boolean(token), operator: false });
    return NextResponse.json(
      { error: denied.ok ? 'Sign in required.' : denied.error },
      { status: denied.ok ? 401 : denied.status }
    );
  }

  const allowed = await isPlatformOperator(token);
  const access = leadInboxAccess({ hasSession: true, hasToken: true, operator: allowed });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    await connectToDatabase();
    const [prospects, contacts] = await Promise.all([
      ProspectLead.find().sort({ createdAt: -1 }).limit(100).select(LEAD_SELECT).lean(),
      ContactSubmission.find().sort({ createdAt: -1 }).limit(100).select(CONTACT_SELECT).lean(),
    ]);

    return NextResponse.json({ leads: mergeOperatorLeads(prospects, contacts) });
  } catch (error) {
    console.error('Lead inbox failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json({ error: 'Leads could not be loaded.' }, { status: 503 });
  }
}
