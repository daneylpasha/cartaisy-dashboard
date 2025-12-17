'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  Bell,
  BellOff,
  Loader2,
  User,
  Package,
  Activity,
  Shield,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerOrderHistory, CustomerActivityFeed } from '@/components/customers';
import { ExportDataButton, DeleteCustomerDataModal } from '@/components/compliance';
import { customersApi, CustomerDetail, CustomerAddress } from '@/lib/api/customers';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
    violet: { bg: 'bg-violet-100', icon: 'text-violet-600' },
    amber: { bg: 'bg-amber-100', icon: 'text-amber-600' },
  };

  const colors = colorClasses[color];

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function AddressCard({ address, isDefault }: { address: CustomerAddress; isDefault?: boolean }) {
  const fullAddress = [
    address.address1,
    address.address2,
    [address.city, address.provinceCode, address.zip].filter(Boolean).join(', '),
    address.country,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            {address.firstName} {address.lastName}
          </span>
        </div>
        {isDefault && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
            Default
          </span>
        )}
      </div>
      {address.company && (
        <p className="text-sm text-slate-600 mb-1">{address.company}</p>
      )}
      <p className="text-sm text-slate-600 whitespace-pre-line">{fullAddress}</p>
      {address.phone && (
        <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {address.phone}
        </p>
      )}
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customersApi.getCustomer(customerId);
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 pb-8">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </Button>
        <div className="p-8 text-center rounded-xl border border-red-200 bg-red-50">
          <p className="text-red-700">{error || 'Customer not found'}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/dashboard/customers')}
          >
            Return to Customer List
          </Button>
        </div>
      </div>
    );
  }

  const customerName =
    customer.firstName || customer.lastName
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : customer.email.split('@')[0];

  const memberSince = formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true });

  return (
    <div className="space-y-8 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/customers')}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </Button>

      {/* Customer Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{customerName}</h1>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/80">
                  Member {memberSince}
                </span>
                {customer.acceptsMarketing ? (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Subscribed
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-500/20 text-slate-400 flex items-center gap-1">
                    <BellOff className="w-3 h-3" />
                    Not subscribed
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-300">
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </a>
                {customer.phone && (
                  <a
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </a>
                )}
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {customer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={customer.totalOrders}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={formatCurrency(customer.totalSpent)}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={formatCurrency(customer.metrics?.averageOrderValue || 0)}
          color="violet"
        />
        <StatCard
          icon={Clock}
          label="Last Order"
          value={
            customer.lastOrderDate
              ? formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true })
              : 'Never'
          }
          color="amber"
        />
      </div>

      {/* Tabs for Orders, Activity, Overview */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="gap-2">
            <User className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="w-4 h-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <a href={`mailto:${customer.email}`} className="text-slate-900 hover:text-blue-600">
                      {customer.email}
                    </a>
                  </div>
                </div>

                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <a href={`tel:${customer.phone}`} className="text-slate-900 hover:text-blue-600">
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Marketing</p>
                    <p className="text-slate-900">
                      {customer.acceptsMarketing ? 'Subscribed to marketing' : 'Not subscribed'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Customer Since</p>
                    <p className="text-slate-900">
                      {format(new Date(customer.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Addresses</h3>
              {customer.addresses && customer.addresses.length > 0 ? (
                <div className="space-y-3">
                  {customer.addresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isDefault={address.isDefault}
                    />
                  ))}
                </div>
              ) : customer.defaultAddress ? (
                <AddressCard address={customer.defaultAddress} isDefault />
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>No addresses on file</p>
                </div>
              )}
            </div>
          </div>

          {/* App Usage Info */}
          {(customer.deviceCount || customer.platforms) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">App Usage</h3>
              <div className="flex flex-wrap gap-6">
                {customer.deviceCount !== undefined && (
                  <div>
                    <p className="text-sm text-slate-500">Devices</p>
                    <p className="text-lg font-medium text-slate-900">{customer.deviceCount}</p>
                  </div>
                )}
                {customer.platforms && customer.platforms.length > 0 && (
                  <div>
                    <p className="text-sm text-slate-500">Platforms</p>
                    <div className="flex gap-2 mt-1">
                      {customer.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 text-sm rounded-lg bg-slate-100 text-slate-700 capitalize"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Order History</h3>
            <CustomerOrderHistory customerId={customerId} />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <CustomerActivityFeed customerId={customerId} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Data & Privacy Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-900">Data & Privacy</h2>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="space-y-6">
            {/* Export Data */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-slate-900">Export Customer Data</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Download all data associated with this customer in a machine-readable format (JSON).
                  Includes personal info, orders, addresses, and activity history.
                </p>
              </div>
              <ExportDataButton customerId={customerId} />
            </div>

            <div className="border-t border-slate-200" />

            {/* GDPR Info */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">GDPR Compliance</p>
                  <p className="text-blue-700">
                    Under GDPR, customers have the right to access and receive a copy of their personal data.
                    Use the export feature above to fulfill data portability requests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-red-900">Delete Customer Data</h4>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete this customer&apos;s personal data. Order history will be anonymized
                but retained for legal purposes. This action cannot be fully undone after 30 days.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Delete Customer Data
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Customer Data Modal */}
      <DeleteCustomerDataModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        customerId={customerId}
        customerEmail={customer.email}
        customerName={customerName}
        onDeleted={() => {
          router.push('/dashboard/customers');
        }}
      />
    </div>
  );
}
