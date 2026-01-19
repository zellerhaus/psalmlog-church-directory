import Link from 'next/link';
import Image from 'next/image';
import { getPopularStates } from '@/lib/data';
import { PSALMLOG_LANDING_URL } from '@/lib/constants';

export default async function Footer() {
  // Use a fixed year to avoid hydration mismatch near midnight/timezone boundaries
  const currentYear = 2026;

  // Fetch popular states from database
  const popularStates = await getPopularStates(4);

  return (
    <footer className="bg-[var(--secondary)] border-t border-[var(--border)]">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/churches" className="flex items-center gap-2 mb-4">
              <Image
                src="/psalmlog-icon.jpg"
                alt="Psalmlog"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-semibold text-lg text-[var(--foreground)]">Psalmlog Church Finder</span>
            </Link>
            <p className="text-[var(--muted)] text-sm max-w-md">
              Find the right church for your life stage, worship style, and spiritual needs.
              We provide visitor-friendly information to help you feel at home before you visit.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/churches" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Browse All Churches
                </Link>
              </li>
              <li>
                <Link href="/churches#states" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Browse by State
                </Link>
              </li>
              <li>
                <Link
                  href={PSALMLOG_LANDING_URL}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Try Psalmlog
                </Link>
              </li>
              <li>
                <Link
                  href="https://psalmlog.com/blog"
                  className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Browse By */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Browse By</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/churches/denominations" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Denominations
                </Link>
              </li>
              <li>
                <Link href="/churches/worship" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Worship Styles
                </Link>
              </li>
              <li>
                <Link href="/churches/programs" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Programs
                </Link>
              </li>
              <li>
                <Link href="/churches/programs/kids-ministry" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Kids Ministry
                </Link>
              </li>
              <li>
                <Link href="/churches/programs/youth-group" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                  Youth Groups
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular States */}
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Popular States</h3>
            <ul className="space-y-2">
              {popularStates.length > 0 ? (
                popularStates.map((state) => (
                  <li key={state.slug}>
                    <Link href={`/churches/${state.slug}`} className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                      {state.name}
                    </Link>
                  </li>
                ))
              ) : (
                // Fallback when database is not available
                <>
                  <li>
                    <Link href="/churches/texas" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                      Texas
                    </Link>
                  </li>
                  <li>
                    <Link href="/churches/california" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                      California
                    </Link>
                  </li>
                  <li>
                    <Link href="/churches/florida" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                      Florida
                    </Link>
                  </li>
                  <li>
                    <Link href="/churches/georgia" className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm">
                      Georgia
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-[var(--muted)] text-sm">
                &copy; {currentYear} Psalmlog. All rights reserved.
              </p>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="https://psalmlog.com/terms"
                  className="text-[var(--muted)] hover:text-[var(--foreground)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms
                </Link>
                <Link
                  href="https://psalmlog.com/privacy"
                  className="text-[var(--muted)] hover:text-[var(--foreground)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy
                </Link>
              </div>
            </div>
            <p className="text-[var(--muted)] opacity-70 text-xs">
              Church information may be outdated. Please verify details with the church directly.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
