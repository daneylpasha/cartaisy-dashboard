import { NextRequest, NextResponse } from 'next/server';
import { leadInboxAccess, mergeOperatorLeads, type OperatorLead } from '@/lib/marketing/leadInbox';

export const dynamic = 'force-dynamic';

const LEAD_SELECT =
  'kind name email storeUrl stage goal outcome outcomeTitle note preferredWindow createdAt';
const CONTACT_SELECT = 'name email subject message createdAt';

type ProspectRow = Parameters<typeof mergeOperatorLeads>[0][number];
type ContactRow = Parameters<typeof mergeOperatorLeads>[1][number];

export type LeadInboxAdapters = {
  getSession: (request: NextRequest) => Promise<unknown>;
  getToken: (request: NextRequest) => Promise<string | null>;
  isPlatformOperator: (token: string) => Promise<boolean>;
  findProspects: () => Promise<ProspectRow[]>;
  findContacts: () => Promise<ContactRow[]>;
};

let adaptersForTests: LeadInboxAdapters | null = null;

/** Fixture seam for `npm run test:c01`. Production GET leaves this unset. */
export function setLeadInboxAdaptersForTests(adapters: LeadInboxAdapters | null) {
  adaptersForTests = adapters;
}

async function productionAdapters(): Promise<LeadInboxAdapters> {
  const { getAuthToken, getServerSession } = await import('@/lib/auth/server');
  const { isPlatformOperator } = await import('@/lib/marketing/platformOps');
  const { connectToDatabase } = await import('@/lib/db');
  const { ContactSubmission } = await import('@/models/ContactSubmission');
  const { ProspectLead } = await import('@/models/ProspectLead');

  return {
    getSession: (request) => getServerSession(undefined, request),
    getToken: (request) => getAuthToken(request),
    isPlatformOperator,
    findProspects: async () => {
      await connectToDatabase();
      const rows = await ProspectLead.find().sort({ createdAt: -1 }).limit(100).select(LEAD_SELECT).lean();
      return rows as ProspectRow[];
    },
    findContacts: async () => {
      await connectToDatabase();
      const rows = await ContactSubmission.find().sort({ createdAt: -1 }).limit(100).select(CONTACT_SELECT).lean();
      return rows as ContactRow[];
    },
  };
}

export async function GET(request: NextRequest) {
  const adapters = adaptersForTests ?? (await productionAdapters());
  const session = await adapters.getSession(request);
  const token = await adapters.getToken(request);
  if (!session || !token) {
    const denied = leadInboxAccess({ hasSession: Boolean(session), hasToken: Boolean(token), operator: false });
    return NextResponse.json(
      { error: denied.ok ? 'Sign in required.' : denied.error },
      { status: denied.ok ? 401 : denied.status }
    );
  }

  const allowed = await adapters.isPlatformOperator(token);
  const access = leadInboxAccess({ hasSession: true, hasToken: true, operator: allowed });
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const [prospects, contacts] = await Promise.all([adapters.findProspects(), adapters.findContacts()]);
    const leads: OperatorLead[] = mergeOperatorLeads(prospects, contacts);
    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Lead inbox failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json({ error: 'Leads could not be loaded.' }, { status: 503 });
  }
}
