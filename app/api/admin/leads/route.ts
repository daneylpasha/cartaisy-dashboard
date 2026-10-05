import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getServerSession } from '@/lib/auth/server';
import { isPlatformOperator } from '@/lib/marketing/platformOps';
import { connectToDatabase } from '@/lib/db';
import { ProspectLead } from '@/models/ProspectLead';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(undefined, request);
  const token = await getAuthToken(request);
  if (!session || !token) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const allowed = await isPlatformOperator(token);
  if (!allowed) {
    return NextResponse.json({ error: 'Operators only.' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const rows = await ProspectLead.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .select('kind name email storeUrl stage goal outcome outcomeTitle note preferredWindow createdAt')
      .lean();

    const leads = rows.map((row) => ({
      id: String(row._id),
      kind: row.kind,
      name: row.name,
      email: row.email,
      storeUrl: row.storeUrl ?? null,
      stage: row.stage ?? null,
      goal: row.goal ?? null,
      outcome: row.outcome ?? null,
      outcomeTitle: row.outcomeTitle ?? null,
      note: row.note ?? null,
      preferredWindow: row.preferredWindow ?? null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Lead inbox failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json({ error: 'Leads could not be loaded.' }, { status: 503 });
  }
}
