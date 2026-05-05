import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Đánh giá Đề cương Học phần',
  description:
    'Ứng dụng AI chấm điểm, đánh giá và chỉnh sửa đề cương học phần đại học.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen">
          <header className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">
                  Đ
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    AI Đánh giá Đề cương Học phần
                  </div>
                  <div className="text-xs text-slate-500">
                    Chấm – Gợi ý – Chỉnh sửa – Lưu trữ
                  </div>
                </div>
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link className="btn-secondary" href="/">
                  Danh sách
                </Link>
                <Link className="btn-primary" href="/new">
                  + Đề cương mới
                </Link>
              </nav>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
          <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-slate-400">
            Powered by Claude • Firebase • Google Cloud Run
          </footer>
        </div>
      </body>
    </html>
  );
}
