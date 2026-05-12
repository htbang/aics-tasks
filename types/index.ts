export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  name: string | null;
  slack_user_id: string | null;
  slack_user_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  creator_id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  assignments?: Assignment[];
}

export interface Assignment {
  id: number;
  task_id: number;
  assigned_to: number;
  assigned_by: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  assigned_at: string;
  completed_at: string | null;
  user_name?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface AssignTaskInput {
  taskId: number;
  assignToSlackName: string; // @name 형식
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
}
