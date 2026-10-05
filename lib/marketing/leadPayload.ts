import { isFitGoal, isFitStage, resolveFitOutcome, type FitGoal, type FitOutcome, type FitStage } from '@/lib/marketing/fitCheck';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LeadKind = 'fit' | 'walkthrough';

export type FitLeadInput = {
  kind: 'fit';
  name: string;
  email: string;
  stage: FitStage;
  goal: FitGoal;
  outcome: FitOutcome;
  outcomeTitle: string;
  storeUrl: string | null;
  note: string | null;
};

export type WalkthroughLeadInput = {
  kind: 'walkthrough';
  name: string;
  email: string;
  storeUrl: string | null;
  note: string | null;
  preferredWindow: string | null;
};

export type LeadInput = FitLeadInput | WalkthroughLeadInput;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: string, max: number): string | null {
  if (!value) return null;
  return value.slice(0, max);
}

export function normalizeOptionalStoreUrl(value: string): { ok: true; url: string | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, url: null };
  if (trimmed.length > 300) return { ok: false, error: 'Store URL is too long.' };
  if (/\s/.test(trimmed)) return { ok: false, error: 'Store URL cannot contain spaces.' };
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    return { ok: false, error: 'Enter a normal store URL, or leave it blank.' };
  }
  if (trimmed.includes('://') && !lower.startsWith('https://') && !lower.startsWith('http://')) {
    return { ok: false, error: 'Store URL must start with http:// or https://, or be a plain domain.' };
  }
  return { ok: true, url: trimmed };
}

function person(body: Record<string, unknown>): { ok: true; name: string; email: string } | { ok: false; error: string } {
  const name = readString(body, 'name').slice(0, 100);
  const email = readString(body, 'email').toLowerCase().slice(0, 100);
  if (name.length < 1) return { ok: false, error: 'Name is required.' };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: 'Enter a valid email address.' };
  return { ok: true, name, email };
}

export function parseFitLead(body: unknown): { ok: true; value: FitLeadInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Send a JSON body.' };
  const record = body as Record<string, unknown>;
  const who = person(record);
  if (!who.ok) return who;
  const stage = record.stage;
  const goal = record.goal;
  if (!isFitStage(stage)) return { ok: false, error: 'Choose where you are with Shopify.' };
  if (!isFitGoal(goal)) return { ok: false, error: 'Choose what you want from Cartaisy.' };
  const store = normalizeOptionalStoreUrl(readString(record, 'storeUrl'));
  if (!store.ok) return store;
  const result = resolveFitOutcome({ stage, goal });
  return {
    ok: true,
    value: {
      kind: 'fit',
      name: who.name,
      email: who.email,
      stage,
      goal,
      outcome: result.outcome,
      outcomeTitle: result.title,
      storeUrl: store.url,
      note: optionalText(readString(record, 'note'), 2000),
    },
  };
}

export function parseWalkthroughLead(
  body: unknown
): { ok: true; value: WalkthroughLeadInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Send a JSON body.' };
  const record = body as Record<string, unknown>;
  const who = person(record);
  if (!who.ok) return who;
  const store = normalizeOptionalStoreUrl(readString(record, 'storeUrl'));
  if (!store.ok) return store;
  return {
    ok: true,
    value: {
      kind: 'walkthrough',
      name: who.name,
      email: who.email,
      storeUrl: store.url,
      note: optionalText(readString(record, 'note'), 2000),
      preferredWindow: optionalText(readString(record, 'preferredWindow'), 200),
    },
  };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip') || 'unknown';
  return forwarded.split(',')[0]?.trim().slice(0, 50) || 'unknown';
}
