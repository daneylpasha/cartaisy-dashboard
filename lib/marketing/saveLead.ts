import { Resend } from 'resend';
import { connectToDatabase } from '@/lib/db';
import { escapeHtml, type LeadInput } from '@/lib/marketing/leadPayload';
import { ProspectLead } from '@/models/ProspectLead';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function compact(lead: LeadInput): Record<string, string> {
  const fields: Record<string, string | null> = {
    kind: lead.kind,
    name: lead.name,
    email: lead.email,
    storeUrl: lead.storeUrl,
    note: lead.note,
    stage: lead.kind === 'fit' ? lead.stage : null,
    goal: lead.kind === 'fit' ? lead.goal : null,
    outcome: lead.kind === 'fit' ? lead.outcome : null,
    outcomeTitle: lead.kind === 'fit' ? lead.outcomeTitle : null,
    preferredWindow: lead.kind === 'walkthrough' ? lead.preferredWindow : null,
  };
  const stored: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value) stored[key] = value;
  }
  return stored;
}

export async function saveProspectLead(lead: LeadInput, ipAddress: string): Promise<void> {
  await connectToDatabase();
  await ProspectLead.create({ ...compact(lead), ipAddress });

  if (!resend) return;
  const rows = Object.entries(compact(lead))
    .map(([key, value]) => `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`)
    .join('');
  try {
    await resend.emails.send({
      from: 'Cartaisy <noreply@cartaisy.com>',
      to: 'sales@rendernext.io',
      replyTo: lead.email,
      subject: lead.kind === 'fit' ? 'Cartaisy fit check' : 'Cartaisy walkthrough request',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">${rows}</div>`,
    });
  } catch (error) {
    console.error('Prospect lead email failed', error instanceof Error ? error.name : 'error');
  }
}
