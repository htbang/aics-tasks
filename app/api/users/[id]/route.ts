import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    const result = await query(
      `SELECT id, firebase_uid, email, name, slack_username,
              notify_due_reminder, notify_overdue, notify_new_assignment
       FROM users WHERE firebase_uid = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];
    return NextResponse.json({
      id: user.id,
      firebaseUid: user.firebase_uid,
      email: user.email,
      name: user.name,
      slackUsername: user.slack_username,
      notifyDueReminder: user.notify_due_reminder,
      notifyOverdue: user.notify_overdue,
      notifyNewAssignment: user.notify_new_assignment,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
