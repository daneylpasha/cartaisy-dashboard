'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, ChevronLeft, Plus } from 'lucide-react';
import { useAuth, useSession } from '@/lib/auth';
import {
  appSwitcherModel,
  canAddApp,
  listMerchantStores,
  readAppName,
  type MerchantStore,
} from '@/lib/auth/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AppSwitcherPanelProps {
  collapsed: boolean;
  inSheet?: boolean;
  storeName: string;
  userName: string;
  logoUrl: string | null;
  mode: 'name' | 'menu';
  open: boolean;
  triggerLabel: 'Switch app' | 'Add app';
  others: MerchantStore[];
  showAdd: boolean;
  showSwitchLabel: boolean;
  pendingId: string | null;
  note: string | null;
  listNote: string | null;
  onToggleOpen: () => void;
  onToggleCollapse?: () => void;
  onSelect: (storeId: string) => void;
  onAdd: () => void;
}

export function AppSwitcherPanel({
  collapsed,
  inSheet = false,
  storeName,
  userName,
  logoUrl,
  mode,
  open,
  triggerLabel,
  others,
  showAdd,
  showSwitchLabel,
  pendingId,
  note,
  listNote,
  onToggleOpen,
  onToggleCollapse,
  onSelect,
  onAdd,
}: AppSwitcherPanelProps) {
  const menuOpen = mode === 'menu' && open && !collapsed;

  return (
    <div className={cn('shrink-0 border-b border-slate-200', inSheet && 'pr-10')} data-app-switcher={mode}>
      <div
        className={cn(
          'flex h-14 items-center',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
        )}
      >
        {collapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="size-8 rounded-lg p-0 hover:bg-slate-100"
            aria-label="Expand sidebar"
          >
            <StoreMark logo={logoUrl} initial={storeName.charAt(0).toUpperCase()} />
          </Button>
        ) : mode === 'menu' ? (
          <>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="app-switcher-list"
              aria-label={triggerLabel}
              onClick={onToggleOpen}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <StoreMark logo={logoUrl} initial={storeName.charAt(0).toUpperCase()} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-slate-950">{storeName}</span>
                <span className="block truncate text-xs text-slate-500">{userName}</span>
              </span>
              <ChevronDown className={cn('size-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
            </button>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="size-7 shrink-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            )}
          </>
        ) : (
          <>
            <StoreMark logo={logoUrl} initial={storeName.charAt(0).toUpperCase()} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-950">{storeName}</p>
              <p className="truncate text-xs text-slate-500">{userName}</p>
            </div>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="size-7 shrink-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>

      {menuOpen && (
        <div id="app-switcher-list" className="px-2 pb-2">
          {showSwitchLabel && (
            <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
              Switch app
            </p>
          )}
          {others.length > 0 && (
            <ul className="max-h-48 space-y-0.5 overflow-y-auto">
              {others.map((store) => (
                <li key={store.id}>
                  <button
                    type="button"
                    disabled={pendingId !== null}
                    onClick={() => onSelect(store.id)}
                    className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
                  >
                    <span className="truncate">{pendingId === store.id ? 'Opening…' : store.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showAdd && (
            <button
              type="button"
              onClick={onAdd}
              disabled={pendingId !== null}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
            >
              <Plus className="size-3.5 shrink-0 text-slate-400" />
              <span>Add app</span>
            </button>
          )}
          {listNote && <p className="px-2.5 pt-1 text-xs leading-5 text-slate-500">{listNote}</p>}
        </div>
      )}

      {note && <p className="px-3 pb-2 text-xs leading-5 text-slate-600">{note}</p>}
    </div>
  );
}

function StoreMark({ logo, initial }: { logo: string | null; initial: string }) {
  if (logo) {
    // Store logos are merchant-hosted URLs, not files in this app.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="" className="size-8 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white"
    >
      {initial || 'A'}
    </span>
  );
}

interface AppSwitcherProps {
  collapsed: boolean;
  inSheet?: boolean;
  storeName: string;
  userName: string;
  logoUrl: string | null;
  onToggleCollapse?: () => void;
}

export function AppSwitcher({
  collapsed,
  inSheet = false,
  storeName,
  userName,
  logoUrl,
  onToggleCollapse,
}: AppSwitcherProps) {
  const { data: session, status } = useSession();
  const { switchApp, addApp } = useAuth();
  const storeId = session?.user?.storeId;
  const role = session?.user?.role;
  const [stores, setStores] = useState<MerchantStore[] | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addRevoked, setAddRevoked] = useState(false);
  const [name, setName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    listMerchantStores().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setStores(result.value.stores);
        setListFailed(false);
      } else {
        setStores(null);
        setListFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [status, storeId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const model = appSwitcherModel({
    stores,
    activeStoreId: storeId,
    canAdd: canAddApp(role, storeId) && !addRevoked,
  });

  async function onSelect(id: string) {
    const chosen = stores?.find((store) => store.id === id);
    setSwitchError(null);
    setPendingId(id);
    const result = await switchApp(id, chosen?.name);
    if (!result.success) {
      setPendingId(null);
      setSwitchError(result.error ?? 'That app could not be opened. Try again.');
    }
  }

  function onAdd() {
    setOpen(false);
    setAddError(null);
    setName('');
    setAddOpen(true);
  }

  function onDialogOpenChange(next: boolean) {
    if (adding) return;
    setAddOpen(next);
    if (!next) {
      setName('');
      setAddError(null);
    }
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const read = readAppName(name);
    if (!read.ok) {
      setAddError(read.message);
      return;
    }
    setAdding(true);
    setAddError(null);
    const result = await addApp(read.name);
    if (!result.success) {
      setAdding(false);
      if (result.forbidden) {
        setAddRevoked(true);
        setAddOpen(false);
        setSwitchError(result.error ?? "You can't add an app on this account.");
        return;
      }
      setAddError(result.error ?? 'That app could not be added. Try again.');
    }
  }

  return (
    <>
      <AppSwitcherPanel
        collapsed={collapsed}
        inSheet={inSheet}
        storeName={storeName}
        userName={userName}
        logoUrl={logoUrl}
        mode={model.mode}
        open={open}
        triggerLabel={model.triggerLabel}
        others={model.others}
        showAdd={model.showAdd}
        showSwitchLabel={model.showSwitchLabel}
        pendingId={pendingId}
        note={switchError}
        listNote={listFailed ? 'Apps could not be loaded.' : null}
        onToggleOpen={() => setOpen((value) => !value)}
        onToggleCollapse={onToggleCollapse}
        onSelect={(id) => {
          void onSelect(id);
        }}
        onAdd={onAdd}
      />
      <Dialog open={addOpen} onOpenChange={onDialogOpenChange}>
        <DialogContent className="sm:max-w-sm" showCloseButton={!adding}>
          <DialogHeader>
            <DialogTitle>Add app</DialogTitle>
            <DialogDescription>
              Starts a new app with its own setup. Nothing is copied from this one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void onCreate(event)} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="new-app-name">App name</Label>
              <Input
                id="new-app-name"
                value={name}
                maxLength={100}
                autoComplete="off"
                disabled={adding}
                onChange={(event) => setName(event.target.value)}
              />
              {addError && <p className="text-xs leading-5 text-slate-600">{addError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={adding} onClick={() => onDialogOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? 'Adding…' : 'Add app'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
