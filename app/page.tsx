import HomePage from './home/page';
import { redirect } from 'next/navigation';

export default async function EntryPage({ searchParams }: { searchParams: Promise<{ experience?: string }> }) {
  const query = await searchParams;
  if (query.experience === 'terminal') redirect('/entry');
  return <HomePage />;
}
