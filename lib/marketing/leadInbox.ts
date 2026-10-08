/**
 * Operator inbox rows for fit checks, walkthrough requests, and contact messages.
 * Authorization is a pure decision so tests can cover it without Mongo or the backend.
 * The route still calls isPlatformOperator before any read.
 */

export type LeadKind = 'fit' | 'walkthrough' | 'contact';

export type OperatorLead = {
  id: string;
  kind: LeadKind;
  name: string;
  email: string;
  createdAt: string | null;
  storeUrl: string | null;
  stage: string | null;
  goal: string | null;
  outcome: string | null;
  outcomeTitle: string | null;
  note: string | null;
  preferredWindow: string | null;
  subject: string | null;
  message: string | null;
};

export const leadKindLabel: Record<LeadKind, string> = {
  fit: 'Fit check',
  walkthrough: 'Walkthrough',
  contact: 'Contact',
};

export type LeadInboxAccess =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

export function leadInboxAccess(input: {
  hasSession: boolean;
  hasToken: boolean;
  operator: boolean;
}): LeadInboxAccess {
  if (!input.hasSession || !input.hasToken) {
    return { ok: false, status: 401, error: 'Sign in required.' };
  }
  if (!input.operator) {
    return { ok: false, status: 403, error: 'Operators only.' };
  }
  return { ok: true };
}

type ProspectSource = {
  _id: unknown;
  kind: 'fit' | 'walkthrough';
  name: string;
  email: string;
  storeUrl?: string | null;
  stage?: string | null;
  goal?: string | null;
  outcome?: string | null;
  outcomeTitle?: string | null;
  note?: string | null;
  preferredWindow?: string | null;
  createdAt?: Date | string | null;
};

type ContactSource = {
  _id: unknown;
  name: string;
  email: string;
  subject?: string | null;
  message?: string | null;
  createdAt?: Date | string | null;
};

function text(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function emptyProspectFields(): Pick<
  OperatorLead,
  'storeUrl' | 'stage' | 'goal' | 'outcome' | 'outcomeTitle' | 'note' | 'preferredWindow' | 'subject' | 'message'
> {
  return {
    storeUrl: null,
    stage: null,
    goal: null,
    outcome: null,
    outcomeTitle: null,
    note: null,
    preferredWindow: null,
    subject: null,
    message: null,
  };
}

export function mergeOperatorLeads(prospects: ProspectSource[], contacts: ContactSource[]): OperatorLead[] {
  const leads: OperatorLead[] = [
    ...prospects.map((row) => ({
      ...emptyProspectFields(),
      id: String(row._id),
      kind: row.kind,
      name: row.name,
      email: row.email,
      createdAt: iso(row.createdAt),
      storeUrl: text(row.storeUrl),
      stage: text(row.stage),
      goal: text(row.goal),
      outcome: text(row.outcome),
      outcomeTitle: text(row.outcomeTitle),
      note: text(row.note),
      preferredWindow: text(row.preferredWindow),
    })),
    ...contacts.map((row) => ({
      ...emptyProspectFields(),
      id: String(row._id),
      kind: 'contact' as const,
      name: row.name,
      email: row.email,
      createdAt: iso(row.createdAt),
      subject: text(row.subject),
      message: text(row.message),
    })),
  ];

  leads.sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
  });

  return leads;
}
