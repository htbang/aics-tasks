import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify the request has the correct secret
  const secret = request.headers.get('x-init-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create admin pool connected to 'postgres' database to create 'tasks' database
    const adminUrl = process.env.DATABASE_URL?.replace('/tasks', '/postgres');
    const adminPool = new Pool({
      connectionString: adminUrl,
      ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false },
    });

    // Create the 'tasks' database if it doesn't exist
    try {
      await adminPool.query('CREATE DATABASE tasks;');
      console.log('✅ Created database "tasks"');
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        console.log('⚠️ Database "tasks" already exists or other error:', err.message);
      }
    }
    await adminPool.end();

    // Now connect to the 'tasks' database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false },
    });

    const schemas = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        slack_username VARCHAR(255),
        notify_due_reminder BOOLEAN DEFAULT true,
        notify_overdue BOOLEAN DEFAULT true,
        notify_new_assignment BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,

      // Assignments table
      `CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );`,

      // Comments table
      `CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        type VARCHAR(50),
        message TEXT,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_tasks_creator_id ON tasks(creator_id);`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_task_id ON assignments(task_id);`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);`,
      `CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
    ];

    const results = [];
    for (const schema of schemas) {
      try {
        await pool.query(schema);
        results.push(`✅ ${schema.substring(0, 50)}...`);
      } catch (err: any) {
        results.push(`⚠️ ${schema.substring(0, 50)}... - ${err.message}`);
      }
    }

    await pool.end();

    return NextResponse.json({
      message: 'Database initialization complete',
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Database initialization failed', error: error.message },
      { status: 500 }
    );
  }
}
