'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useAuth, useSession } from '@/lib/auth';
import {
  appSwitcherModel,
  canAddApp,
  confirmAppName,
  deleteAppAvailability,
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
  currentApp: MerchantStore | null;
  canDelete: boolean;
  onlyAppNote: string | null;
  onToggleOpen: () => void;
  onToggleCollapse?: () => void;
  onSelect: (storeId: string) => void;
  onAdd: () => void;
  onDelete: (store: MerchantStore) => void;
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
  currentApp,
  canDelete,
  onlyAppNote,
  onToggleOpen,
  onToggleCollapse,
  onSelect,
  onAdd,
  onDelete,
}: AppSwitcherPanelProps) {
  const menuOpen = mode === 'menu' && open && !collapsed;

  return (
    <div className={cn('shrink-0 border-b border-slate-200', inSheet && 'pr-10')} data-app-switcher={mode}>
      <div
        className={cn(
          'flex items-center',
          collapsed ? 'flex-col justify-center gap-1.5 px-2 py-2.5' : 'h-14 gap-2.5 px-3',
        )}
      >
        {collapsed ? (
          <>
            <StoreMark logo={logoUrl} initial={storeName.charAt(0).toUpperCase()} />
            {onToggleCollapse && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleCollapse}
                className="size-8 rounded-lg border-slate-200 p-0 text-slate-700 hover:bg-slate-50"
                aria-label="Expand sidebar"
                title="Expand sidebar"
                data-sidebar-toggle="expand"
              >
                <ChevronRight className="size-4" />
              </Button>
            )}
          </>
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
                title="Collapse sidebar"
                data-sidebar-toggle="collapse"
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
                title="Collapse sidebar"
                data-sidebar-toggle="collapse"
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
                <li key={store.id} className="flex items-center">
                  <button
                    type="button"
                    disabled={pendingId !== null}
                    onClick={() => onSelect(store.id)}
                    className="flex min-w-0 flex-1 items-center rounded-md px-2.5 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
                  >
                    <span className="truncate">{pendingId === store.id ? 'Opening…' : store.name}</span>
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      disabled={pendingId !== null}
                      onClick={() => onDelete(store)}
                      aria-label={`Delete ${store.name}`}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
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
          {canDelete && currentApp && (
            <div className="mt-1 border-t border-slate-200 pt-1">
              <button
                type="button"
                disabled={pendingId !== null}
                onClick={() => onDelete(currentApp)}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
              >
                <Trash2 className="size-3.5 shrink-0" />
                <span>Delete this app</span>
              </button>
            </div>
          )}
          {onlyAppNote && <p className="px-2.5 pt-1 text-xs leading-5 text-slate-500">{onlyAppNote}</p>}
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

export function DeleteAppConfirm({
  appName,
  typed,
  error,
  pending,
  onTyped,
  onCancel,
  onConfirm,
}: {
  appName: string;
  typed: string;
  error: string | null;
  pending: boolean;
  onTyped: (value: string) => void;
  onCancel: () => void;
  onConfirm: (event: FormEvent) => void;
}) {
  const confirmed = confirmAppName(typed, appName);

  return (
    <form onSubmit={onConfirm} className="grid gap-3" data-delete-app-confirm="">
      <p className="text-sm leading-6 text-slate-600">
        This removes {appName} from your account and from anyone invited to it. It leaves Switch app. The store is
        turned off and its Shopify connection is disconnected. You can&apos;t restore it here.
      </p>
      <div className="grid gap-1.5">
        <Label htmlFor="delete-app-name">Type {appName} to confirm</Label>
        <Input
          id="delete-app-name"
          value={typed}
          maxLength={100}
          autoComplete="off"
          autoFocus
          disabled={pending}
          onChange={(event) => onTyped(event.target.value)}
        />
        {error && <p className="text-xs leading-5 text-rose-700">{error}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={pending || !confirmed}>
          {pending ? 'Removing…' : 'Delete app'}
        </Button>
      </DialogFooter>
    </form>
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
  const { switchApp, addApp, deleteApp } = useAuth();
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
  const [deleteTarget, setDeleteTarget] = useState<MerchantStore | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const canOwn = canAddApp(role, storeId) && !addRevoked;
  const model = appSwitcherModel({
    stores,
    activeStoreId: storeId,
    canAdd: canOwn,
  });
  const removal = deleteAppAvailability({
    canOwn,
    storeCount: stores ? stores.length : null,
  });
  const currentApp = stores?.find((store) => store.id === storeId) ?? null;

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

  function onDelete(store: MerchantStore) {
    setOpen(false);
    setDeleteError(null);
    setConfirmName('');
    setDeleteTarget(store);
  }

  function onDeleteOpenChange(next: boolean) {
    if (deleting) return;
    if (!next) {
      setDeleteTarget(null);
      setConfirmName('');
      setDeleteError(null);
    }
  }

  async function onConfirmDelete(event: FormEvent) {
    event.preventDefault();
    if (!deleteTarget || !confirmAppName(confirmName, deleteTarget.name)) {
      setDeleteError('Type the app name exactly to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteApp(deleteTarget.id, deleteTarget.name);
    if (!result.success) {
      setDeleting(false);
      setDeleteError(result.error ?? 'That app could not be removed. Try again.');
      return;
    }
    const removedId = deleteTarget.id;
    setStores((current) => current?.filter((store) => store.id !== removedId) ?? current);
    setDeleting(false);
    setDeleteTarget(null);
    setConfirmName('');
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
        currentApp={currentApp}
        canDelete={removal.canDelete}
        onlyAppNote={removal.onlyAppNote}
        onToggleOpen={() => setOpen((value) => !value)}
        onToggleCollapse={onToggleCollapse}
        onSelect={(id) => {
          void onSelect(id);
        }}
        onAdd={onAdd}
        onDelete={onDelete}
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
      <Dialog open={deleteTarget !== null} onOpenChange={onDeleteOpenChange}>
        <DialogContent className="sm:max-w-sm" showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription className="sr-only">
              Confirm by typing the app name. This turns the store off and removes it from your account.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <DeleteAppConfirm
              appName={deleteTarget.name}
              typed={confirmName}
              error={deleteError}
              pending={deleting}
              onTyped={setConfirmName}
              onCancel={() => onDeleteOpenChange(false)}
              onConfirm={(event) => {
                void onConfirmDelete(event);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
