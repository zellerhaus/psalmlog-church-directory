import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { US_STATES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: 'Invalid coordinates. Please provide valid lat and lng parameters.' },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured() || !supabase) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    // Find the nearest church to the given coordinates
    // Using PostGIS to calculate distance
    const { data: nearestChurch, error } = await supabase
      .from('churches')
      .select('city, state_abbr, state')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('location', {
        ascending: true,
        // This won't work without a proper PostGIS query, so we'll use a different approach
      })
      .limit(1);

    // Alternative approach: Use RPC function if available, or calculate manually
    // For now, let's try to find the nearest church using a bounding box approach
    const radiusDegrees = 0.5; // Roughly 30-35 miles

    const { data: nearbyChurches, error: nearbyError } = await supabase
      .from('churches')
      .select('city, state_abbr, state, lat, lng')
      .gte('lat', lat - radiusDegrees)
      .lte('lat', lat + radiusDegrees)
      .gte('lng', lng - radiusDegrees)
      .lte('lng', lng + radiusDegrees)
      .limit(100);

    if (nearbyError || !nearbyChurches || nearbyChurches.length === 0) {
      // Expand search radius
      const { data: expandedSearch } = await supabase
        .from('churches')
        .select('city, state_abbr, state, lat, lng')
        .gte('lat', lat - 2)
        .lte('lat', lat + 2)
        .gte('lng', lng - 2)
        .lte('lng', lng + 2)
        .limit(100);

      if (!expandedSearch || expandedSearch.length === 0) {
        return NextResponse.json({
          city: null,
          state: null,
          message: 'No churches found nearby'
        });
      }

      // Find the closest church from expanded search
      const closest = findClosest(expandedSearch, lat, lng);
      return buildResponse(closest);
    }

    // Find the closest church
    const closest = findClosest(nearbyChurches, lat, lng);
    return buildResponse(closest);

  } catch (err) {
    console.error('Error finding nearest city:', err);
    return NextResponse.json(
      { error: 'Failed to find nearest city' },
      { status: 500 }
    );
  }
}

function findClosest(
  churches: { city: string; state_abbr: string; state: string; lat: number; lng: number }[],
  userLat: number,
  userLng: number
) {
  let closest = churches[0];
  let minDistance = getDistance(userLat, userLng, closest.lat, closest.lng);

  for (const church of churches) {
    const distance = getDistance(userLat, userLng, church.lat, church.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closest = church;
    }
  }

  return closest;
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Haversine formula for accurate distance
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function buildResponse(church: { city: string; state_abbr: string; state: string }) {
  const stateInfo = US_STATES.find(s => s.abbr === church.state_abbr);
  const stateSlug = stateInfo?.slug || church.state_abbr.toLowerCase();
  const citySlug = church.city.toLowerCase().replace(/\s+/g, '-');

  return NextResponse.json({
    city: church.city,
    state: church.state,
    stateAbbr: church.state_abbr,
    stateSlug,
    citySlug,
  });
}
