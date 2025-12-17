'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Database,
  Download,
  Clock,
  Cookie,
  Link as LinkIcon,
  ChevronLeft,
  Loader2,
  Info,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportDataButton } from '@/components/compliance';
import { complianceApi, ComplianceSettings } from '@/lib/api/compliance';
import { cn } from '@/lib/utils';

interface DataCollectionItemProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

function DataCollectionItem({ title, description, icon: Icon }: DataCollectionItemProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg border border-slate-200 bg-white">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h4 className="font-medium text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

interface ComingSoonCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

function ComingSoonCard({ title, description, icon: Icon }: ComingSoonCardProps) {
  return (
    <div className="relative p-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="absolute top-3 right-3">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-600">
          Coming Soon
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div>
          <h4 className="font-medium text-slate-700">{title}</h4>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function ComplianceSettingsPage() {
  const [settings, setSettings] = useState<ComplianceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await complianceApi.getComplianceSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to fetch compliance settings:', err);
        // Use defaults on error
        setSettings({
          dataRetentionDays: 365,
          cookieConsentEnabled: false,
          dataCollectionDisclosure: {
            personalInfo: 'We collect name, email, and phone number to process orders and provide customer support.',
            orderHistory: 'Order history is retained to provide purchase records and enable reordering.',
            activityTracking: 'We track app usage to improve your shopping experience and provide personalized recommendations.',
            deviceInfo: 'Device information helps us optimize the app and send push notifications.',
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Back Link */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
            <Shield className="w-4 h-4" />
            <span>Privacy & Compliance</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            GDPR Compliance
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            Manage data privacy settings and ensure compliance with GDPR and other data protection regulations.
          </p>
        </div>
      </div>

      {/* Data Retention Policy */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Data Retention Policy</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">Current Retention Period</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {settings?.dataRetentionDays || 365} days
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Customer data is retained for {settings?.dataRetentionDays || 365} days after the last interaction.
                After this period, inactive customer records are automatically anonymized while order history
                is preserved for legal and accounting purposes.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-700">What gets retained:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside text-slate-600">
                  <li>Anonymized order records for tax and legal compliance</li>
                  <li>Aggregate analytics data (not personally identifiable)</li>
                  <li>System logs for security purposes (90 days max)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Collection Disclosure */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Data Collection & Purpose</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataCollectionItem
            icon={FileText}
            title="Personal Information"
            description={settings?.dataCollectionDisclosure?.personalInfo || 'Name, email, and phone for order processing and support.'}
          />
          <DataCollectionItem
            icon={Database}
            title="Order History"
            description={settings?.dataCollectionDisclosure?.orderHistory || 'Purchase records for receipts and reordering.'}
          />
          <DataCollectionItem
            icon={Clock}
            title="Activity Tracking"
            description={settings?.dataCollectionDisclosure?.activityTracking || 'Usage patterns for personalization and improvements.'}
          />
          <DataCollectionItem
            icon={Shield}
            title="Device Information"
            description={settings?.dataCollectionDisclosure?.deviceInfo || 'Device data for app optimization and notifications.'}
          />
        </div>
      </div>

      {/* Bulk Data Export */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Bulk Data Export</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-900">Export All Customer Data</h3>
              <p className="text-sm text-slate-600 mt-1">
                Download a complete export of all customer data for GDPR compliance requests.
                This includes all personal information, orders, addresses, and activity data
                for every customer in your store.
              </p>
            </div>
            <ExportDataButton size="default" />
          </div>

          <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-medium">GDPR Data Portability</p>
                <p className="text-emerald-700 mt-1">
                  This export fulfills Article 20 of GDPR - the right to data portability.
                  Data is provided in a structured, machine-readable JSON format.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Additional Settings</h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
            Coming Soon
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ComingSoonCard
            icon={LinkIcon}
            title="Privacy Policy URL"
            description="Configure your privacy policy URL to be displayed in the mobile app."
          />
          <ComingSoonCard
            icon={Cookie}
            title="Cookie Consent"
            description="Enable cookie consent banners and manage cookie preferences."
          />
          <ComingSoonCard
            icon={Clock}
            title="Retention Period"
            description="Configure custom data retention periods for different data types."
          />
        </div>
      </div>

      {/* GDPR Rights Summary */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Customer Rights Under GDPR</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-700">Right to Access (Article 15)</p>
                <p className="text-slate-600">Customers can request a copy of their personal data.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Right to Rectification (Article 16)</p>
                <p className="text-slate-600">Customers can request corrections to their data.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Right to Erasure (Article 17)</p>
                <p className="text-slate-600">Customers can request deletion of their data.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Right to Data Portability (Article 20)</p>
                <p className="text-slate-600">Customers can receive their data in a portable format.</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Use the customer detail page to handle individual data requests, or use bulk export for complete data access requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
