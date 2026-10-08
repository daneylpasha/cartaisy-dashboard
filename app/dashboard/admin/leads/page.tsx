'use client';

import { useEffect, useState } from 'react';
import { leadKindLabel, type LeadKind, type OperatorLead } from '@/lib/marketing/leadInbox';

type Phase = 'loading' | 'ready' | 'forbidden' | 'error';

function details(lead: OperatorLead): string {
  if (lead.kind === 'contact') return lead.subject || '—';
  return lead.outcomeTitle || lead.outcome || '—';
}

function extra(lead: OperatorLead): string {
  if (lead.kind === 'contact') return lead.message || '';
  const parts = [lead.stage, lead.goal, lead.preferredWindow].filter(Boolean);
  return [parts.join(' · '), lead.note || ''].filter(Boolean).join('\n');
}

export default function LeadsPage() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [leads, setLeads] = useState<OperatorLead[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/api/admin/leads', { cache: 'no-store' });
        if (response.status === 401 || response.status === 403) {
          if (!cancelled) setPhase('forbidden');
          return;
        }
        const data = (await response.json()) as { leads?: OperatorLead[]; error?: string };
        if (!response.ok || !data.leads) {
          if (!cancelled) {
            setMessage(data.error || 'Leads could not be loaded.');
            setPhase('error');
          }
          return;
        }
        if (!cancelled) {
          setLeads(data.leads);
          setPhase('ready');
        }
      } catch {
        if (!cancelled) {
          setMessage('Leads could not be loaded.');
          setPhase('error');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === 'loading') {
    return <p className="p-6 text-sm text-slate-600">Loading leads…</p>;
  }

  if (phase === 'forbidden') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-950">Leads</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
          Fit checks, walkthrough requests, and contact messages are visible to Cartaisy operators only.
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-slate-950">Leads</h1>
        <p role="alert" className="mt-2 text-sm text-red-700">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-950">Leads</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Fit checks, walkthrough requests, and contact form messages. Newest first. This inbox does not send invites.
      </p>
      {leads.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">No submissions yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th scope="col" className="py-2 pr-4 font-medium">When</th>
                <th scope="col" className="py-2 pr-4 font-medium">Type</th>
                <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                <th scope="col" className="py-2 pr-4 font-medium">Email</th>
                <th scope="col" className="py-2 pr-4 font-medium">Subject or outcome</th>
                <th scope="col" className="py-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={`${lead.kind}-${lead.id}`} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 text-slate-600">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
                  </td>
                  <td className="py-3 pr-4">{leadKindLabel[lead.kind as LeadKind] || lead.kind}</td>
                  <td className="py-3 pr-4">{lead.name}</td>
                  <td className="py-3 pr-4">
                    <a className="underline" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                    {lead.storeUrl && <div className="mt-1 break-all text-slate-500">{lead.storeUrl}</div>}
                  </td>
                  <td className="py-3 pr-4">{details(lead)}</td>
                  <td className="max-w-xs whitespace-pre-wrap py-3 text-slate-700">{extra(lead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
