import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendDueReminder } from '@/lib/slack';

export const runtime = 'nodejs';

// GET /api/cron/check-due-dates - Vercel Crons에 의해 호출
export async function GET(request: NextRequest) {
  // Vercel Crons 검증
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 마감일이 1일 이내인 할일 조회
    const result = await query(
      `SELECT a.id, u.slack_user_id, u.slack_user_name, t.title, t.due_date,
              EXTRACT(DAY FROM t.due_date - NOW()) as days_left
       FROM assignments a
       JOIN users u ON a.assigned_to = u.id
       JOIN tasks t ON a.task_id = t.id
       WHERE t.status != 'done'
       AND t.due_date IS NOT NULL
       AND t.due_date > NOW() - INTERVAL '1 day'
       AND a.status = 'accepted'
       AND (
         EXTRACT(DAY FROM t.due_date - NOW()) <= 1
         OR EXTRACT(DAY FROM t.due_date - NOW()) <= 0
       )
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = u.id
         AND n.task_id = t.id
         AND n.type = CASE
           WHEN EXTRACT(DAY FROM t.due_date - NOW()) <= 0 THEN 'overdue'
           ELSE 'due_soon'
         END
         AND n.sent_at > NOW() - INTERVAL '24 hours'
       )`
    );

    let sentCount = 0;

    // 각 할일에 대해 알림 전송
    for (const row of result.rows) {
      try {
        const daysLeft = Math.ceil(parseFloat(row.days_left));

        if (row.slack_user_id) {
          await sendDueReminder(row.slack_user_id, row.title, daysLeft);

          // 알림 로그 저장
          await query(
            `INSERT INTO notifications (user_id, task_id, type, slack_sent, sent_at)
             VALUES ($1, $2, $3, true, NOW())`,
            [
              (
                await query('SELECT id FROM users WHERE slack_user_id = $1', [row.slack_user_id])
              ).rows[0]?.id,
              row.task_id,
              daysLeft <= 0 ? 'overdue' : 'due_soon',
            ]
          );

          sentCount++;
        }
      } catch (error) {
        console.error(`Error sending reminder for task ${row.title}:`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${sentCount} due date reminders`,
        checksRun: result.rowCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    );
  }
}
