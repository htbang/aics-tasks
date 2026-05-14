'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  createdBy: string;
  status: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tasks', {
        headers: {
          'x-user-id': user.uid,
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError('할일 목록을 불러올 수 없습니다');
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      alert('할일 제목을 입력하세요!');
      return;
    }

    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          dueDate,
          priority,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '할일 생성 실패');
      }

      setShowModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');

      await fetchTasks();
      alert('✅ 할일이 생성되었습니다!');
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setShowEditModal(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          dueDate,
          priority,
          status: editingTask.status,
        }),
      });

      if (!response.ok) {
        throw new Error('할일 수정 실패');
      }

      setShowEditModal(false);
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('medium');
      await fetchTasks();
      alert('✅ 할일이 수정되었습니다!');
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user || !confirm('삭제하시겠습니까?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('할일 삭제 실패');
      }

      await fetchTasks();
      alert('✅ 할일이 삭제되었습니다!');
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">📊 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">전체 할일</div>
          <div className="text-3xl font-bold mt-2">{tasks.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">진행 중</div>
          <div className="text-3xl font-bold mt-2">{tasks.filter(t => t.status === 'in_progress').length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="text-sm text-green-600 dark:text-green-400 font-semibold">완료됨</div>
          <div className="text-3xl font-bold mt-2">{tasks.filter(t => t.status === 'completed').length}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="text-sm text-red-600 dark:text-red-400 font-semibold">마감 예정</div>
          <div className="text-3xl font-bold mt-2">{
            tasks.filter(t => {
              if (!t.dueDate) return false;
              const dueDate = new Date(t.dueDate).getTime();
              const now = new Date().getTime();
              const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
              return dueDate - now <= threeDaysMs && dueDate >= now;
            }).length
          }</div>
        </div>
      </div>

      {/* 할일 리스트 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">📋 할일 목록</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
          >
            + 새 할일
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">로드 중...</p>
          ) : tasks.length === 0 ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">할일이 없습니다</h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    "새 할일" 버튼을 클릭해서 첫 번째 할일을 추가하세요!
                  </p>
                </div>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                  준비 중
                </span>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`border rounded-lg p-4 transition ${
                  task.status === 'completed'
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                          const updateTask = async () => {
                            if (!user) return;
                            try {
                              const token = await user.getIdToken();
                              const response = await fetch(`/api/tasks/${task.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'x-user-id': user.uid,
                                  'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({ status: newStatus }),
                              });
                              if (response.ok) {
                                await fetchTasks();
                              }
                            } catch (err) {
                              console.error('Failed to update task:', err);
                            }
                          };
                          updateTask();
                        }}
                        className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                      />
                      <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'line-through text-slate-500 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </h3>
                    </div>
                    {task.description && (
                      <p className="text-slate-600 dark:text-slate-400 mt-1 ml-8">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 ml-8">
                        마감일: {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 flex-shrink-0">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
                      {task.priority === 'high' && '🔴 높음'}
                      {task.priority === 'medium' && '🟡 중간'}
                      {task.priority === 'low' && '🟢 낮음'}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      task.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : task.status === 'in_progress'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {task.status === 'completed' && '✅ 완료'}
                      {task.status === 'in_progress' && '⏳ 진행 중'}
                      {task.status === 'pending' && '⏸️ 대기'}
                    </span>
                    <button
                      onClick={() => openEditModal(task)}
                      className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full transition cursor-pointer"
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-xs bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-full transition cursor-pointer"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 팀 현황 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">👥 팀 현황</h2>
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400">
            아직 팀원이 없습니다. 설정에서 Slack 사용자명을 추가하세요.
          </p>
        </div>
      </div>

      {/* 빠른 시작 */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🚀 다음 단계</h2>
        <ol className="space-y-3 list-decimal list-inside text-slate-700 dark:text-slate-300">
          <li>✅ <strong>프로젝트 초기화</strong> - 완료!</li>
          <li>⏳ <strong>할일 작성</strong> - 위 버튼으로 시작</li>
          <li>⏳ <strong>팀원 초대</strong> - 설정에서 Slack 연동</li>
          <li>⏳ <strong>할일 배정</strong> - @mention으로 배정</li>
          <li>⏳ <strong>진행 상황 추적</strong> - 대시보드에서 확인</li>
        </ol>
      </div>

      {/* 새 할일 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold">📝 새 할일 작성</h2>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold mb-2">제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="할일 제목을 입력하세요"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-semibold mb-2">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="할일 설명을 입력하세요"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
              />
            </div>

            {/* 마감일 */}
            <div>
              <label className="block text-sm font-semibold mb-2">마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 우선도 */}
            <div>
              <label className="block text-sm font-semibold mb-2">우선도</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="low">🟢 낮음</option>
                <option value="medium">🟡 중간</option>
                <option value="high">🔴 높음</option>
              </select>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
              >
                ✅ 생성
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
              >
                ❌ 취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 할일 수정 모달 */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold">✏️ 할일 수정</h2>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold mb-2">제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="할일 제목을 입력하세요"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-semibold mb-2">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="할일 설명을 입력하세요"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
              />
            </div>

            {/* 마감일 */}
            <div>
              <label className="block text-sm font-semibold mb-2">마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 우선도 */}
            <div>
              <label className="block text-sm font-semibold mb-2">우선도</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="low">🟢 낮음</option>
                <option value="medium">🟡 중간</option>
                <option value="high">🔴 높음</option>
              </select>
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-sm font-semibold mb-2">상태</label>
              <select
                value={editingTask.status}
                onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="pending">⏸️ 대기</option>
                <option value="in_progress">⏳ 진행 중</option>
                <option value="completed">✅ 완료</option>
              </select>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdateTask}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
              >
                ✅ 저장
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer"
              >
                ❌ 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
