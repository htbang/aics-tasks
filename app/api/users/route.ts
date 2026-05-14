import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, email, slackUsername, notifyDueReminder, notifyOverdue, notifyNewAssignment } = body;

    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      // Create new user
      await query(
        `INSERT INTO users (firebase_uid, email, name, slack_username, notify_due_reminder, notify_overdue, notify_new_assignment)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, email, name, slackUsername, notifyDueReminder, notifyOverdue, notifyNewAssignment]
      );
    } else {
      // Update existing user
      await query(
        `UPDATE users
         SET email = $1, name = $2, slack_username = $3, notify_due_reminder = $4, notify_overdue = $5, notify_new_assignment = $6, updated_at = NOW()
         WHERE firebase_uid = $7`,
        [email, name, slackUsername, notifyDueReminder, notifyOverdue, notifyNewAssignment, userId]
      );
    }

    return NextResponse.json({ message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving user settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
