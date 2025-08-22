import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarEvent } from '@/lib/integrations';

// Google Calendar API Integration
export async function POST(request: NextRequest) {
  try {
    const { 
      restaurant, 
      date, 
      time, 
      duration = 2, 
      accessToken 
    } = await request.json();

    if (!restaurant || !date || !time || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Create calendar event
    const eventDate = new Date(`${date}T${time}`);
    const calendarEvent = generateCalendarEvent(restaurant, eventDate, duration);

    // Google Calendar API call
    const googleCalendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: calendarEvent.title,
          description: calendarEvent.description,
          start: {
            dateTime: calendarEvent.start.toISOString(),
            timeZone: 'America/New_York', // You might want to detect user's timezone
          },
          end: {
            dateTime: calendarEvent.end.toISOString(),
            timeZone: 'America/New_York',
          },
          location: calendarEvent.location,
          source: {
            title: 'YumZoom',
            url: calendarEvent.url,
          },
        }),
      }
    );

    if (!googleCalendarResponse.ok) {
      const error = await googleCalendarResponse.text();
      console.error('Google Calendar API error:', error);
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      );
    }

    const createdEvent = await googleCalendarResponse.json();

    return NextResponse.json({
      success: true,
      eventId: createdEvent.id,
      eventUrl: createdEvent.htmlLink,
      message: 'Dining event added to calendar successfully!',
    });

  } catch (error) {
    console.error('Calendar integration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get calendar authorization URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'google';
    
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/calendar/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Calendar integration not configured' },
        { status: 500 }
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return NextResponse.json({
      authUrl: authUrl.toString(),
      provider,
    });

  } catch (error) {
    console.error('Calendar auth URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
