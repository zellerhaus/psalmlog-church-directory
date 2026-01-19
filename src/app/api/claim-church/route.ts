import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ChurchClaim } from '@/types/database';

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('Turnstile secret key not configured, skipping verification');
    return true;
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
    }),
  });

  const data = await response.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      churchId,
      churchName,
      fullName,
      email,
      phone,
      role,
      roleDescription,
      verificationInfo,
      message,
      pageUrl,
      turnstileToken,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = body;

    // Validate required fields
    if (!churchId) {
      return NextResponse.json({ error: 'Church ID is required' }, { status: 400 });
    }

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // Verify Turnstile token
    if (turnstileToken) {
      const isValid = await verifyTurnstileToken(turnstileToken);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Verification failed. Please try again.' },
          { status: 400 }
        );
      }
    } else if (process.env.TURNSTILE_SECRET_KEY) {
      return NextResponse.json({ error: 'Verification required' }, { status: 400 });
    }

    // Store in Supabase
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Supabase not configured');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const claimData: Omit<ChurchClaim, 'id' | 'created_at'> = {
      church_id: churchId,
      church_name: churchName,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      role_description: roleDescription || null,
      verification_info: verificationInfo || null,
      message: message || null,
      page_url: pageUrl || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      status: 'pending',
      admin_notes: null,
    };

    const { error: insertError } = await supabase
      .from('church_claims')
      .insert(claimData as never);

    if (insertError) {
      console.error('Failed to insert church claim:', insertError);
      return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 });
    }

    // Send notification via Customer.io
    const customerIoSiteId = process.env.CUSTOMERIO_SITE_ID;
    const customerIoApiKey = process.env.CUSTOMERIO_API_KEY;

    if (customerIoSiteId && customerIoApiKey) {
      try {
        const response = await fetch('https://track.customer.io/api/v1/forms/church_claim_request/submit', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${customerIoSiteId}:${customerIoApiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              email: email.trim().toLowerCase(),
              full_name: fullName.trim(),
              phone: phone.trim(),
              role,
              role_description: roleDescription || '',
              church_id: churchId,
              church_name: churchName,
              verification_info: verificationInfo || '',
              message: message || '',
              page_url: pageUrl || '',
              utm_source: utm_source || '',
              utm_medium: utm_medium || '',
              utm_campaign: utm_campaign || '',
              utm_term: utm_term || '',
              utm_content: utm_content || '',
            },
          }),
        });

        if (!response.ok) {
          console.error('Customer.io notification error:', await response.text());
          // Don't fail the request, just log the error
        }
      } catch (notificationError) {
        console.error('Failed to send Customer.io notification:', notificationError);
        // Don't fail the request, claim was already saved
      }
    } else {
      // Log for development
      console.log('Church claim submitted:', {
        churchId,
        churchName,
        fullName,
        email,
        phone,
        role,
      });
    }

    return NextResponse.json({ success: true, message: 'Claim submitted successfully' });
  } catch (error) {
    console.error('Church claim error:', error);
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 });
  }
}
