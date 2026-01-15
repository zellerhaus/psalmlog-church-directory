import { ImageResponse } from 'next/og';
import { US_STATES } from '@/lib/constants';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const state = US_STATES.find((s) => s.slug === slug);
    const stateName = state ? state.name : 'US Churches';

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a', // primary navy
                    backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
                    fontFamily: 'serif',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    {/* Simple Cross Icon */}
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
                        padding: '40px',
                    }}
                >
                    <div
                        style={{
                            color: '#94a3b8', // text-gray-400
                            fontSize: 24,
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '4px',
                            fontWeight: 'bold',
                        }}
                    >
                        Churches In
                    </div>
                    <div
                        style={{
                            color: 'white',
                            fontSize: 80,
                            fontWeight: 900,
                            lineHeight: 1,
                            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        }}
                    >
                        {stateName}
                    </div>
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#cbd5e1', // text-gray-300
                    fontSize: 20,
                }}>
                    Find your spiritual home
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
