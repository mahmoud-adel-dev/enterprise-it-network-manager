import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  clearAllNotifications,
} from '@/server/services/notifications';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const category = (url.searchParams.get('category') as 'ALL' | 'ALERTS' | 'SYSTEM') || 'ALL';
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);

    const data = await getNotifications({
      userId: session.userId,
      category,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error('[api/notifications] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    if (action === 'mark-read' && typeof id === 'string') {
      const updated = await markNotificationAsRead(id, session.userId);
      if (!updated) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'mark-all-read') {
      await markAllNotificationsAsRead(session.userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[api/notifications] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (id) {
      const dismissed = await dismissNotification(id, session.userId);
      if (!dismissed) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    // Otherwise clear all for this user only
    await clearAllNotifications(session.userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/notifications] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
