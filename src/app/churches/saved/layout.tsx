import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Saved Churches | ${SITE_NAME}`,
  description: 'View your saved churches. Bookmark churches you want to visit and access them anytime.',
  robots: { index: false, follow: true },
};

export default function SavedChurchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
