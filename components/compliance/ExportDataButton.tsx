'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { complianceApi, DataExportRequest, ExportStatus } from '@/lib/api/compliance';
import { cn } from '@/lib/utils';

interface ExportDataButtonProps {
  customerId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ExportDataButton({
  customerId,
  variant = 'outline',
  size = 'default',
  className,
}: ExportDataButtonProps) {
  const [exportRequest, setExportRequest] = useState<DataExportRequest | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollInterval = 3000; // Poll every 3 seconds

  // Poll for export status
  useEffect(() => {
    if (!exportRequest) return;
    if (exportRequest.status === 'completed' || exportRequest.status === 'failed') return;

    const pollStatus = async () => {
      try {
        const status = await complianceApi.getExportStatus(exportRequest.id);
        setExportRequest(status);
      } catch (err) {
        console.error('Failed to poll export status:', err);
      }
    };

    const intervalId = setInterval(pollStatus, pollInterval);
    return () => clearInterval(intervalId);
  }, [exportRequest]);

  const handleExport = useCallback(async () => {
    try {
      setIsRequesting(true);
      setError(null);

      const request = customerId
        ? await complianceApi.requestCustomerDataExport(customerId)
        : await complianceApi.requestBulkDataExport();

      setExportRequest(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request export');
    } finally {
      setIsRequesting(false);
    }
  }, [customerId]);

  const handleDownload = useCallback(async () => {
    if (!exportRequest) return;

    try {
      // Determine if this is a bulk export (no customerId means bulk)
      const isBulk = !customerId;

      // Use the API download function which handles auth and file download
      await complianceApi.downloadExport(exportRequest.id, {
        customerId: exportRequest.customerId,
        customerName: exportRequest.customerName,
        isBulk,
        totalCustomers: exportRequest.totalCustomers,
      });
    } catch (err) {
      console.error('Download failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to download export');
    }
  }, [exportRequest, customerId]);

  const handleReset = useCallback(() => {
    setExportRequest(null);
    setError(null);
  }, []);

  // Render based on state
  if (error) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button variant="outline" size={size} onClick={handleReset} className="gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Try Again
        </Button>
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (exportRequest) {
    return (
      <ExportStatusDisplay
        request={exportRequest}
        onDownload={handleDownload}
        onReset={handleReset}
        size={size}
        className={className}
      />
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isRequesting}
      className={cn('gap-2', className)}
    >
      {isRequesting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Requesting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {customerId ? 'Export Customer Data' : 'Export All Customer Data'}
        </>
      )}
    </Button>
  );
}

interface ExportStatusDisplayProps {
  request: DataExportRequest;
  onDownload: () => void;
  onReset: () => void;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

function ExportStatusDisplay({
  request,
  onDownload,
  onReset,
  size = 'default',
  className,
}: ExportStatusDisplayProps) {
  const statusConfig: Record<ExportStatus, { icon: React.ElementType; text: string; color: string }> = {
    pending: {
      icon: Clock,
      text: 'Export queued...',
      color: 'text-amber-600',
    },
    processing: {
      icon: Loader2,
      text: 'Preparing export...',
      color: 'text-blue-600',
    },
    completed: {
      icon: CheckCircle,
      text: 'Export ready',
      color: 'text-emerald-600',
    },
    failed: {
      icon: AlertCircle,
      text: 'Export failed',
      color: 'text-red-600',
    },
  };

  const config = statusConfig[request.status];
  const Icon = config.icon;
  const isAnimated = request.status === 'processing';

  if (request.status === 'completed') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Button variant="default" size={size} onClick={onDownload} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4" />
          Download Export
        </Button>
        <Button variant="ghost" size={size} onClick={onReset}>
          New Export
        </Button>
      </div>
    );
  }

  if (request.status === 'failed') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Export failed</span>
        </div>
        <Button variant="outline" size={size} onClick={onReset}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', config.color, className)}>
      <Icon className={cn('w-4 h-4', isAnimated && 'animate-spin')} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}
