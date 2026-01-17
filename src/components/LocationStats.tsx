import { Church, Users, Music, Heart } from 'lucide-react';
import type { LocationStats as LocationStatsType } from '@/types/content';

interface LocationStatsProps {
  stats: LocationStatsType;
  locationName: string;
  compact?: boolean;
}

export default function LocationStats({
  stats,
  locationName,
  compact = false,
}: LocationStatsProps) {
  if (!stats || stats.church_count === 0) {
    return null;
  }

  // Get top denominations (up to 5)
  const topDenominations = Object.entries(stats.denominations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Get top worship styles (up to 4)
  const topWorshipStyles = Object.entries(stats.worship_styles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Calculate percentages for programs
  const kidsPercent = Math.round(
    (stats.programs.kids_ministry / stats.church_count) * 100
  );
  const youthPercent = Math.round(
    (stats.programs.youth_group / stats.church_count) * 100
  );
  const groupsPercent = Math.round(
    (stats.programs.small_groups / stats.church_count) * 100
  );

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Church className="w-5 h-5" />}
          value={stats.church_count}
          label="Churches"
        />
        {stats.city_count && (
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={stats.city_count}
            label="Cities"
          />
        )}
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          value={`${kidsPercent}%`}
          label="Kids Ministry"
        />
        <StatCard
          icon={<Music className="w-5 h-5" />}
          value={topWorshipStyles[0]?.[0] || 'Various'}
          label="Top Style"
        />
      </div>
    );
  }

  return (
    <div className="bg-[var(--secondary)] rounded-lg p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-[var(--foreground)] font-serif">
        Churches in {locationName} at a Glance
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Denominations */}
        {topDenominations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--muted)] mb-3 uppercase tracking-wide">
              Top Denominations
            </h3>
            <div className="space-y-2">
              {topDenominations.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-[var(--foreground)]">{name}</span>
                  <span className="text-[var(--muted)] text-sm">
                    {count} church{count !== 1 ? 'es' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worship Styles */}
        {topWorshipStyles.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--muted)] mb-3 uppercase tracking-wide">
              Worship Styles
            </h3>
            <div className="flex flex-wrap gap-2">
              {topWorshipStyles.map(([style, count]) => (
                <span
                  key={style}
                  className="px-3 py-1 bg-white rounded-full text-sm text-[var(--foreground)] border border-[var(--border)]"
                >
                  {style} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Programs */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-medium text-[var(--muted)] mb-3 uppercase tracking-wide">
            Family Programs Available
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <ProgramStat
              label="Kids Ministry"
              count={stats.programs.kids_ministry}
              percent={kidsPercent}
            />
            <ProgramStat
              label="Youth Groups"
              count={stats.programs.youth_group}
              percent={youthPercent}
            />
            <ProgramStat
              label="Small Groups"
              count={stats.programs.small_groups}
              percent={groupsPercent}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="md:col-span-2 pt-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted)] italic">
            This information may not cover every church in {locationName}. We&apos;re constantly working to improve our database and add more churches.
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 text-center">
      <div className="text-[var(--primary)] mb-2 flex justify-center">{icon}</div>
      <div className="text-xl font-bold text-[var(--foreground)]">{value}</div>
      <div className="text-sm text-[var(--muted)]">{label}</div>
    </div>
  );
}

interface ProgramStatProps {
  label: string;
  count: number;
  percent: number;
}

function ProgramStat({ label, count, percent }: ProgramStatProps) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-[var(--primary)]">{percent}%</div>
      <div className="text-sm text-[var(--foreground)]">{label}</div>
      <div className="text-xs text-[var(--muted)]">({count} churches)</div>
    </div>
  );
}
