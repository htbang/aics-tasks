import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AICS Tasks - 팀 업무 관리",
  description: "AICS 팀을 위한 할일 관리 및 업무 배정 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <AuthProvider>
          <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">📋 AICS Tasks</h1>
              <div className="flex gap-6">
                <a href="/" className="hover:text-blue-600 transition">
                  홈
                </a>
                <a href="/dashboard" className="hover:text-blue-600 transition">
                  대시보드
                </a>
                <a href="/settings" className="hover:text-blue-600 transition">
                  설정
                </a>
              </div>
            </nav>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">{children}</main>

          <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center py-4 text-sm text-slate-600 dark:text-slate-400 mt-auto">
            <p>© 2025 AICS Team. All rights reserved.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
