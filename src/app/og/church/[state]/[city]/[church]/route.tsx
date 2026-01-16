import { ImageResponse } from 'next/og';
import { US_STATES } from '@/lib/constants';
import { getChurchBySlug } from '@/lib/data';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ state: string; city: string; church: string }> }
) {
    const { state: stateSlug, city: citySlug, church: churchSlug } = await params;
    const state = US_STATES.find((s) => s.slug === stateSlug);

    let churchName = 'Church Not Found';
    let location = '';
    let denomination = '';

    if (state) {
        try {
            const church = await getChurchBySlug(state.abbr, citySlug, churchSlug);
            if (church) {
                churchName = church.name;
                location = `${church.city}, ${church.state_abbr}`;
                denomination = church.denomination || '';
            }
        } catch (e) {
            console.error('Failed to fetch church for OG image', e);
        }
    }

    const response = new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a',
                    backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
                    fontFamily: 'serif',
                    padding: '40px',
                }}
            >
                {/* Background Pattern */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.1,
                        backgroundImage: 'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
                        backgroundSize: '100px 100px',
                    }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'auto' }}>
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 4v16m-8-8h16" />
                    </svg>
                    <div style={{ color: 'white', fontSize: 32, fontWeight: 600 }}>Psalmlog Church Finder</div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        marginTop: 'auto',
                        marginBottom: 'auto',
                    }}
                >
                    {denomination && (
                        <div
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '8px 24px',
                                borderRadius: '100px',
                                color: '#cbd5e1',
                                fontSize: 24,
                                marginBottom: '24px',
                                fontWeight: '500',
                            }}
                        >
                            {denomination}
                        </div>
                    )}

                    <div
                        style={{
                            color: 'white',
                            fontSize: 72,
                            fontWeight: 900,
                            marginBottom: '16px',
                            lineHeight: 1.1,
                            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            maxWidth: '1000px',
                        }}
                    >
                        {churchName}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#94a3b8',
                            fontSize: 32,
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        {location}
                    </div>
                </div>

                <div style={{
                    marginTop: 'auto',
                    color: '#cbd5e1',
                    fontSize: 20,
                }}>
                    Complete visitor guide • Service times • Programs
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );

    // Add cache headers to prevent repeated database hits from social media bots
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    return response;
}
