import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/tasks - 할일 목록 조회
export async function GET(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-user-id');
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date,
              u.name as creator_name,
              json_agg(json_build_object('id', a.id, 'assigned_to', a.assigned_to, 'user_name', u2.name)) as assignments
       FROM tasks t
       LEFT JOIN users u ON t.creator_id = u.id
       LEFT JOIN assignments a ON t.id = a.task_id
       LEFT JOIN users u2 ON a.assigned_to = u2.id
       GROUP BY t.id, u.name
       ORDER BY t.due_date ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks - 새 할일 생성
export async function POST(request: NextRequest) {
  try {
    const firebaseUid = request.headers.get('x-user-id');
    if (!firebaseUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, priority, dueDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Firebase UID로 user_id 조회
    const userResult = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    const result = await query(
      `INSERT INTO tasks (creator_id, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, description || null, priority || 'medium', dueDate || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
