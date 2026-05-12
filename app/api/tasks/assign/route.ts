import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendTaskAssignmentNotification } from '@/lib/slack';

// POST /api/tasks/assign - 할일 배정
export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-user-id');
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, assignToSlackName } = await request.json();

    if (!taskId || !assignToSlackName) {
      return NextResponse.json(
        { error: 'taskId and assignToSlackName are required' },
        { status: 400 }
      );
    }

    // 할당하려는 사용자 찾기 (Slack 이름으로)
    const userResult = await query(
      'SELECT id, slack_user_id, slack_user_name FROM users WHERE slack_user_name = $1',
      [assignToSlackName.replace(/^@/, '').toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: `User @${assignToSlackName} not found` },
        { status: 404 }
      );
    }

    const assignedToUser = userResult.rows[0];
    const assignedById = (
      await query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid])
    ).rows[0]?.id;

    if (!assignedById) {
      return NextResponse.json({ error: 'Assigner user not found' }, { status: 404 });
    }

    // 할일 정보 조회
    const taskResult = await query('SELECT title, due_date FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskResult.rows[0];

    // 할당 정보 저장
    const assignmentResult = await query(
      `INSERT INTO assignments (task_id, assigned_to, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (task_id, assigned_to) DO UPDATE SET assigned_by = $3
       RETURNING *`,
      [taskId, assignedToUser.id, assignedById]
    );

    // Slack 알림 발송
    if (assignedToUser.slack_user_id) {
      try {
        await sendTaskAssignmentNotification(
          assignedToUser.slack_user_id,
          assignedToUser.slack_user_name,
          task.title,
          task.due_date
        );
      } catch (slackError) {
        console.error('Failed to send Slack notification:', slackError);
        // 알림 발송 실패해도 할당은 성공
      }
    }

    return NextResponse.json(assignmentResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks/assign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
