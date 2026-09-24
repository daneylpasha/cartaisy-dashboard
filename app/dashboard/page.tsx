import type { Metadata } from 'next';
import { DashboardHome } from '@/components/dashboard/home/DashboardHome';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return <DashboardHome />;
}
