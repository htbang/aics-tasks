'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="text-center py-12">로드 중...</div>;
  }

  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">🎯 AICS 팀 업무 관리</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
          팀 구성원 간 할일 배정 및 진행 상황을 한눈에 관리하세요
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
          >
            로그인
          </a>
          <a
            href="/login"
            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition cursor-pointer"
          >
            회원가입
          </a>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:shadow-lg transition">
          <h3 className="text-xl font-bold mb-2">📝 할일 작성</h3>
          <p className="text-slate-600 dark:text-slate-400">
            새로운 할일을 작성하고 마감일을 설정하세요.
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:shadow-lg transition">
          <h3 className="text-xl font-bold mb-2">👥 할일 배정</h3>
          <p className="text-slate-600 dark:text-slate-400">
            팀 구성원에게 @mention으로 할일을 배정하세요.
          </p>
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:shadow-lg transition">
          <h3 className="text-xl font-bold mb-2">🔔 자동 알림</h3>
          <p className="text-slate-600 dark:text-slate-400">
            마감일 임박 시 Slack으로 자동 알림을 받으세요.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">시작 가이드</h2>
        <ol className="space-y-3 list-decimal list-inside text-slate-700 dark:text-slate-300">
          <li>GitHub으로 가입하거나 이메일로 회원가입합니다</li>
          <li>설정에서 Slack 사용자명을 연결합니다</li>
          <li>대시보드에서 새로운 할일을 작성합니다</li>
          <li>@팀원이름 형식으로 할일을 배정합니다</li>
          <li>마감일이 임박하면 Slack 알림을 받습니다</li>
        </ol>
      </section>
    </div>
  );
}
