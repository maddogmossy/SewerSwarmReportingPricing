// app/uploaded/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  // Send anyone using the old link to the new P4
  redirect('/reports');
}