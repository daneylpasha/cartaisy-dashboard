'use client';

import { useState, useCallback } from 'react';
import {
  AlertTriangle,
  Trash2,
  Loader2,
  CheckCircle,
  X,
  ShieldAlert,
} from 'lucide-react';
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
import { complianceApi } from '@/lib/api/compliance';
import { cn } from '@/lib/utils';

interface DeleteCustomerDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerEmail: string;
  customerName: string;
  onDeleted?: () => void;
}

type DeletionStep = 'warning' | 'confirm' | 'processing' | 'success' | 'error';

export function DeleteCustomerDataModal({
  open,
  onOpenChange,
  customerId,
  customerEmail,
  customerName,
  onDeleted,
}: DeleteCustomerDataModalProps) {
  const [step, setStep] = useState<DeletionStep>('warning');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setStep('warning');
    setConfirmEmail('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onOpenChange(false);
  }, [handleReset, onOpenChange]);

  const handleProceedToConfirm = useCallback(() => {
    setStep('confirm');
  }, []);

  const handleDelete = useCallback(async () => {
    if (confirmEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      setError('Email does not match. Please enter the correct email.');
      return;
    }

    try {
      setStep('processing');
      setError(null);

      await complianceApi.requestCustomerDataDeletion(customerId, confirmEmail);

      setStep('success');
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer data');
      setStep('error');
    }
  }, [customerId, customerEmail, confirmEmail, onDeleted]);

  const isEmailMatch = confirmEmail.toLowerCase() === customerEmail.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === 'warning' && (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-center">Delete Customer Data</DialogTitle>
              <DialogDescription className="text-center">
                You are about to permanently delete data for <strong>{customerName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-2">This action will permanently delete:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700">
                      <li>Personal information (name, email, phone)</li>
                      <li>All saved addresses</li>
                      <li>Activity history and analytics data</li>
                      <li>Push notification tokens and preferences</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  <strong>Note:</strong> Order history will be anonymized but retained for legal and
                  accounting purposes. The customer record will be soft-deleted and can be restored
                  within 30 days if needed.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleProceedToConfirm}
                className="w-full sm:w-auto gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Proceed to Delete
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-center">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-center">
                Type the customer&apos;s email to confirm deletion
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-email">
                  Type <span className="font-mono bg-slate-100 px-1 rounded">{customerEmail}</span> to
                  confirm
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder="Enter customer email"
                  value={confirmEmail}
                  onChange={(e) => {
                    setConfirmEmail(e.target.value);
                    setError(null);
                  }}
                  className={cn(
                    error && 'border-red-500 focus-visible:ring-red-500'
                  )}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700 font-medium">
                  This action cannot be undone after 30 days.
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('warning')} className="w-full sm:w-auto">
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isEmailMatch}
                className="w-full sm:w-auto gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Customer Data
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-900">Deleting customer data...</p>
            <p className="text-sm text-slate-500 mt-1">This may take a moment</p>
          </div>
        )}

        {step === 'success' && (
          <>
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Data Deletion Initiated</h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Customer data for <strong>{customerName}</strong> has been scheduled for deletion.
                Personal information has been anonymized.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'error' && (
          <>
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Deletion Failed</h3>
              <p className="text-sm text-red-600 max-w-sm mx-auto">{error}</p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep('confirm')}
                className="w-full sm:w-auto"
              >
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
