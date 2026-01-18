import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source, page_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content } = body;

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
      // Customer.io Forms API - creates person and triggers form_submit event
      const response = await fetch('https://track.customer.io/api/v1/forms/visitor_guide_download/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${customerIoSiteId}:${customerIoApiKey}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            email,
            source: source || 'church_directory',
            page_url: page_url || '',
            utm_source: utm_source || '',
            utm_medium: utm_medium || '',
            utm_campaign: utm_campaign || '',
            utm_term: utm_term || '',
            utm_content: utm_content || '',
          }
        }),
      });

      if (!response.ok) {
        console.error('Customer.io error:', await response.text());
        // Don't fail the request, just log the error
      }
    } else {
      // Log for development
      console.log('Email subscription:', { email, source, page_url });
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
