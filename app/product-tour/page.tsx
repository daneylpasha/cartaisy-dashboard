import { redirect } from 'next/navigation';
import { offerPaths } from '@/lib/marketing/offer';

export default function ProductTourAlias() {
  redirect(offerPaths.demo);
}
