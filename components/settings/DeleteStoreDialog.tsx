'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { DeleteAppConfirm } from '@/components/dashboard/AppSwitcher';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { listMerchantStores, ONLY_APP_NOTE } from '@/lib/auth/stores';

interface DeleteStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  storeId: string;
}

export function DeleteStoreDialog({ open, onOpenChange, storeName, storeId }: DeleteStoreDialogProps) {
  const { deleteApp } = useAuth();
  const [appName, setAppName] = useState(storeName);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [onlyApp, setOnlyApp] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTyped('');
    setError(null);
    setAppName(storeName);
    setOnlyApp(false);
    setChecked(false);
    let cancelled = false;
    listMerchantStores().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        const match = result.value.stores.find((store) => store.id === storeId);
        if (match) setAppName(match.name);
        setOnlyApp(result.value.stores.length < 2);
      }
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, storeId, storeName]);

  function handleOpenChange(next: boolean) {
    if (pending) return;
    onOpenChange(next);
  }

  async function onConfirm(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await deleteApp(storeId, appName);
    if (!result.success) {
      setPending(false);
      setError(result.error ?? 'That app could not be removed. Try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>{onlyApp ? 'This app stays' : `Delete ${appName}?`}</DialogTitle>
          <DialogDescription className="sr-only">
            {onlyApp
              ? 'The last app cannot be removed.'
              : 'Confirm by typing the app name. This turns the store off and removes it from your account.'}
          </DialogDescription>
        </DialogHeader>
        {!checked ? (
          <p className="text-sm leading-6 text-slate-600">Checking your apps…</p>
        ) : onlyApp ? (
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-slate-600">{ONLY_APP_NOTE}</p>
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <DeleteAppConfirm
            appName={appName}
            typed={typed}
            error={error}
            pending={pending}
            onTyped={setTyped}
            onCancel={() => handleOpenChange(false)}
            onConfirm={(event) => {
              void onConfirm(event);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
