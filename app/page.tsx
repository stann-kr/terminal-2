import HomePage from './home/page';
import EntryExperience from './_entry/EntryExperience';

export default async function EntryPage({ searchParams }: { searchParams: Promise<{ experience?: string }> }) {
  const query = await searchParams;
  if (query.experience === 'terminal') return <EntryExperience />;
  return <HomePage />;
}
