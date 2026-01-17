import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPopularStates } from '@/lib/data';

export default async function ChurchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch top 5 states by church count for the header dropdown
  let popularStates: { name: string; slug: string }[] = [];
  try {
    const states = await getPopularStates(5);
    popularStates = states.map(s => ({ name: s.name, slug: s.slug }));
  } catch {
    // Use empty array if database not connected
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header popularStates={popularStates} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
