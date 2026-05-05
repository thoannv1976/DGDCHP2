'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSyllabusPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [credits, setCredits] = useState<string>('');
  const [program, setProgram] = useState('');
  const [level, setLevel] = useState('Đại học');
  const [content, setContent] = useState('');
  const [originalFileName, setOriginalFileName] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Upload thất bại');
      setContent(j.content);
      setOriginalFileName(j.fileName);
      if (!title) setTitle(file.name.replace(/\.(pdf|docx|txt|md)$/i, ''));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/syllabi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          courseCode: courseCode || undefined,
          credits: credits ? Number(credits) : undefined,
          program: program || undefined,
          level: level || undefined,
          content,
          originalFileName,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      router.push(`/syllabus/${j.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">Tạo đề cương mới</h1>

      <div className="card space-y-4">
        <div>
          <label className="label">Tải lên file đề cương (DOCX, PDF, TXT)</label>
          <input
            type="file"
            accept=".docx,.pdf,.txt,.md"
            onChange={handleUpload}
            disabled={busy}
            className="text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống sẽ trích xuất văn bản tự động vào ô nội dung bên dưới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tên học phần *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mã học phần</label>
            <input
              className="input"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Số tín chỉ</label>
            <input
              className="input"
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Trình độ</label>
            <input
              className="input"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Chương trình đào tạo</label>
            <input
              className="input"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Nội dung đề cương *</label>
          <textarea
            className="textarea min-h-[320px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Dán toàn văn đề cương học phần tại đây hoặc tải file lên ở trên..."
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex justify-end gap-2">
          <button
            disabled={busy || !title || !content}
            onClick={save}
            className="btn-primary"
          >
            {busy ? 'Đang lưu...' : 'Lưu đề cương'}
          </button>
        </div>
      </div>
    </div>
  );
}
