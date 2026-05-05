import Link from 'next/link';
import { listSyllabi } from '@/lib/repo';

export const dynamic = 'force-dynamic';

function fmt(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('vi-VN');
  } catch {
    return d;
  }
}

export default async function HomePage() {
  let items: Awaited<ReturnType<typeof listSyllabi>> = [];
  let err: string | null = null;
  try {
    items = await listSyllabi();
  } catch (e: any) {
    err = e.message;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Đề cương học phần</h1>
          <p className="text-sm text-slate-500">
            Quản lý, đánh giá và chỉnh sửa đề cương bằng AI.
          </p>
        </div>
        <Link href="/new" className="btn-primary">
          + Đề cương mới
        </Link>
      </div>

      {err && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm">
          Không kết nối được Firebase: {err}. Vui lòng kiểm tra cấu hình
          ENV (xem README).
        </div>
      )}

      {!err && items.length === 0 && (
        <div className="card text-center text-slate-500">
          Chưa có đề cương nào. Bấm <strong>Đề cương mới</strong> để bắt đầu.
        </div>
      )}

      <div className="grid gap-3">
        {items.map((s) => (
          <Link
            key={s.id}
            href={`/syllabus/${s.id}`}
            className="card hover:border-brand-500 transition flex items-start justify-between"
          >
            <div>
              <div className="font-semibold text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                {s.courseCode && <>Mã: {s.courseCode} • </>}
                {s.credits != null && <>{s.credits} TC • </>}
                {s.program && <>{s.program} • </>}
                Cập nhật {fmt(s.updatedAt)}
              </div>
            </div>
            {s.latestEvaluationId && (
              <span className="badge bg-emerald-100 text-emerald-700">
                Đã đánh giá
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
