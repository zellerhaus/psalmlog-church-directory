import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // In production, send to Customer.io
    const customerIoSiteId = process.env.CUSTOMERIO_SITE_ID;
    const customerIoApiKey = process.env.CUSTOMERIO_API_KEY;

    if (customerIoSiteId && customerIoApiKey) {
      // Customer.io Track API
      const response = await fetch('https://track.customer.io/api/v1/customers', {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${customerIoSiteId}:${customerIoApiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          created_at: Math.floor(Date.now() / 1000),
          source: source || 'church_directory',
          tags: ['church_directory', 'visitor_guide'],
        }),
      });

      if (!response.ok) {
        console.error('Customer.io error:', await response.text());
        // Don't fail the request, just log the error
      }
    } else {
      // Log for development
      console.log('Email subscription:', { email, source });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
