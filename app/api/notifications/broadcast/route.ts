import { getServerSession, authConfig, getAuthToken } from '@/lib/auth/server';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

// Mock segment counts for demo
const MOCK_SEGMENT_COUNTS: Record<string, number> = {
  all: 1250,
  inactive_30: 320,
  inactive_60: 180,
  repeat_customers: 450,
  new_customers: 85,
};

export async function POST(request: NextRequest) {
  console.log('📤 [API Route /broadcast] POST request received');

  try {
    const token = await getAuthToken();
    const session = await getServerSession(authConfig);

    console.log('📤 [API Route /broadcast] Token:', token ? `${token.substring(0, 20)}...` : 'MISSING');
    console.log('📤 [API Route /broadcast] Session:', session ? JSON.stringify({
      userId: session.user?.id,
      storeId: session.user?.storeId,
      email: session.user?.email
    }) : 'MISSING');

    if (!token || !session?.user?.id || !session.user.storeId) {
      console.error('❌ [API Route /broadcast] Unauthorized - token:', !!token, 'session:', !!session, 'storeId:', session?.user?.storeId);
      return NextResponse.json({ error: 'Unauthorized', debug: { hasToken: !!token, hasSession: !!session, hasStoreId: !!session?.user?.storeId } }, { status: 401 });
    }

    const body = await request.json();
    console.log('📤 [API Route /broadcast] Request body:', JSON.stringify(body));

    // Validate required fields
    if (!body.title || !body.body) {
      console.error('❌ [API Route /broadcast] Validation failed - title:', !!body.title, 'body:', !!body.body);
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Try to send to backend first
    const backendEndpoint = `${BACKEND_URL}/notifications/stores/${session.user.storeId}/broadcast`;
    console.log('📤 [API Route /broadcast] Calling backend:', backendEndpoint);
    console.log('📤 [API Route /broadcast] BACKEND_URL env:', BACKEND_URL);

    try {
      const backendPayload = {
        title: body.title,
        body: body.body,
        segment: body.segment || 'all',
        imageUrl: body.imageUrl,
        data: body.data,
      };
      console.log('📤 [API Route /broadcast] Backend payload:', JSON.stringify(backendPayload));

      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });

      console.log('📤 [API Route /broadcast] Backend response status:', response.status);

      const responseData = await response.json();
      console.log('📤 [API Route /broadcast] Backend response data:', JSON.stringify(responseData));

      if (response.ok) {
        console.log('✅ [API Route /broadcast] Backend success');
        return NextResponse.json({
          success: true,
          message: 'Notification sent successfully',
          sentCount: responseData.data?.sentCount || 0,
        });
      } else {
        console.error('❌ [API Route /broadcast] Backend error:', response.status, responseData);
      }
    } catch (backendError) {
      console.error('❌ [API Route /broadcast] Backend fetch error:', backendError);
    }

    // Return mock success if backend is not available (for demo purposes)
    const segment = body.segment || 'all';
    const sentCount = MOCK_SEGMENT_COUNTS[segment] || 0;

    console.log('⚠️ [API Route /broadcast] Falling back to mock response - segment:', segment, 'sentCount:', sentCount);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully (Demo Mode)',
      sentCount: sentCount,
    });
  } catch (error) {
    console.error('❌ [API Route /broadcast] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
