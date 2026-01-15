import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        <li>
          <Link
            href="/churches"
            className="text-[var(--muted)] hover:text-[var(--foreground)] flex items-center"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--foreground)] font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
