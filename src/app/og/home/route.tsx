import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
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
                    backgroundColor: '#0f172a',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                    {/* Simple Cross Icon */}
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 4v16m-8-8h16" />
                    </svg>
                    <div style={{ color: 'white', fontSize: 40, fontWeight: 600 }}>Psalmlog Church Finder</div>
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
                            color: 'white',
                            fontSize: 72,
                            fontWeight: 900,
                            lineHeight: 1.1,
                            textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            marginBottom: '24px',
                        }}
                    >
                        Find Your Church Home
                    </div>
                    <div
                        style={{
                            color: '#94a3b8',
                            fontSize: 28,
                            maxWidth: '800px',
                            lineHeight: 1.4,
                        }}
                    >
                        Discover the right faith community for your life stage, worship style, and spiritual needs
                    </div>
                </div>

                <div style={{
                    position: 'absolute',
                    bottom: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    color: '#cbd5e1',
                    fontSize: 22,
                }}>
                    <span>🔍 Easy Search</span>
                    <span>•</span>
                    <span>📖 Visitor Guides</span>
                    <span>•</span>
                    <span>⛪ All Denominations</span>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
