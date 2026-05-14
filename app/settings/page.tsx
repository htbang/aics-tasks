'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [slackUsername, setSlackUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifyDueReminder, setNotifyDueReminder] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyNewAssignment, setNotifyNewAssignment] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/users/${user.uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setName(data.name || '');
        setEmail(data.email || user.email || '');
        setSlackUsername(data.slackUsername || '');
        setNotifyDueReminder(data.notifyDueReminder ?? true);
        setNotifyOverdue(data.notifyOverdue ?? true);
        setNotifyNewAssignment(data.notifyNewAssignment ?? true);
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      return;
    }

    try {
      setError('');
      const token = await user.getIdToken();
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.uid,
        },
        body: JSON.stringify({
          name,
          email: email || user.email,
          slackUsername,
          notifyDueReminder,
          notifyOverdue,
          notifyNewAssignment,
        }),
      });

      if (!response.ok) {
        throw new Error('설정 저장 실패');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 5000);
      console.log('프로필 설정 저장됨:', { name, email, slackUsername });
    } catch (err: any) {
      setError(err.message || '설정 저장 중 오류가 발생했습니다');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl space-y-8">
        <h1 className="text-3xl font-bold">⚙️ 설정</h1>
        <p className="text-slate-600 dark:text-slate-400">로드 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">⚙️ 설정</h1>

      {/* 저장 완료 메시지 */}
      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400">
          ✅ 설정이 저장되었습니다!
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          ❌ {error}
        </div>
      )}

      {/* 프로필 설정 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">👤 프로필 설정</h2>

        <div className="space-y-6">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-semibold mb-2">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="당신의 이름"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-semibold mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Slack 연동 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">🤖 Slack 연동</h2>

        <div className="space-y-6">
          {/* Slack 사용자명 */}
          <div>
            <label className="block text-sm font-semibold mb-2">Slack 사용자명</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                @
              </span>
              <input
                type="text"
                value={slackUsername}
                onChange={(e) => setSlackUsername(e.target.value)}
                placeholder="slack_username"
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              ⚠️ 할일 배정 시 @슬랙사용자명 형식으로 사용됩니다
            </p>
          </div>

          {/* Slack 연동 상태 */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">연동 상태</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {slackUsername ? '🟢 연결됨' : '🔴 미연결'}
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition cursor-pointer">
                {slackUsername ? '재연결' : '연결'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">🔔 알림 설정</h2>

        <div className="space-y-4">
          {/* 마감 1일 전 알림 */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={notifyDueReminder}
              onChange={(e) => setNotifyDueReminder(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div>
              <p className="font-semibold">마감일 1일 전 알림</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Slack으로 미리 알림을 받습니다</p>
            </div>
          </label>

          {/* 마감일 지난 알림 */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={notifyOverdue}
              onChange={(e) => setNotifyOverdue(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div>
              <p className="font-semibold">마감일 지난 할일 알림</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">미완료 할일이 있으면 매일 알립니다</p>
            </div>
          </label>

          {/* 할일 배정 알림 */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={notifyNewAssignment}
              onChange={(e) => setNotifyNewAssignment(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <div>
              <p className="font-semibold">새 할일 배정 알림</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">누군가 할일을 배정하면 즉시 알립니다</p>
            </div>
          </label>
        </div>
      </div>

      {/* 보안 */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">🔐 보안</h2>

        <div className="space-y-4">
          <button className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-lg font-semibold transition cursor-pointer">
            비밀번호 변경
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg font-semibold transition cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
        >
          💾 설정 저장
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}
