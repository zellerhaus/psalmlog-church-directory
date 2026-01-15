import { NextRequest, NextResponse } from 'next/server';
import { getChurchBySlug } from '@/lib/data';
import { US_STATES } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ state: string; city: string; church: string }> }
) {
  try {
    const { state: stateSlug, city: citySlug, church: churchSlug } = await params;

    // Find state info to get abbreviation
    const stateInfo = US_STATES.find((s) => s.slug === stateSlug);
    if (!stateInfo) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    const church = await getChurchBySlug(stateInfo.abbr, citySlug, churchSlug);

    if (!church) {
      return NextResponse.json({ error: 'Church not found' }, { status: 404 });
    }

    return NextResponse.json(church);
  } catch (error) {
    console.error('Error fetching church:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
