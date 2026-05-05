'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Evaluation, SyllabusDoc } from '@/lib/types';

type EvalRecord = Evaluation & { id: string };

function scoreColor(score: number) {
  if (score >= 4.5) return 'bg-emerald-100 text-emerald-700';
  if (score >= 3.5) return 'bg-lime-100 text-lime-700';
  if (score >= 2.5) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function SyllabusDetail({
  initialSyllabus,
  initialEvaluations,
}: {
  initialSyllabus: SyllabusDoc;
  initialEvaluations: EvalRecord[];
}) {
  const router = useRouter();
  const [syl, setSyl] = useState<SyllabusDoc>(initialSyllabus);
  const [evals, setEvals] = useState<EvalRecord[]>(initialEvaluations);
  const [tab, setTab] = useState<'content' | 'evaluation' | 'revise'>('content');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SyllabusDoc>(initialSyllabus);
  const [reviseInstructions, setReviseInstructions] = useState('');
  const [reviseResult, setReviseResult] = useState<{
    revised: string;
    changeLog: string[];
  } | null>(null);

  const latest: EvalRecord | null = useMemo(() => evals[0] ?? null, [evals]);

  async function saveEdits() {
    setBusy('save');
    setErr(null);
    try {
      const r = await fetch(`/api/syllabi/${syl.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          courseCode: draft.courseCode,
          credits: draft.credits,
          program: draft.program,
          level: draft.level,
          content: draft.content,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      setSyl(j);
      setEditing(false);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function evaluate() {
    setBusy('evaluate');
    setErr(null);
    try {
      const r = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusId: syl.id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Đánh giá thất bại');
      setEvals([{ id: j.id, ...j.evaluation }, ...evals]);
      setTab('evaluation');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function revise(applyToSyllabus: boolean) {
    if (!latest) return;
    setBusy('revise');
    setErr(null);
    setReviseResult(null);
    try {
      const r = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusId: syl.id,
          evaluationId: latest.id,
          instructions: reviseInstructions || undefined,
          applyToSyllabus,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Chỉnh sửa thất bại');
      setReviseResult(j);
      if (applyToSyllabus) {
        setSyl({ ...syl, content: j.revised });
        setDraft({ ...draft, content: j.revised });
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm('Xóa đề cương này khỏi cơ sở dữ liệu?')) return;
    setBusy('delete');
    try {
      await fetch(`/api/syllabi/${syl.id}`, { method: 'DELETE' });
      router.push('/');
    } catch (e: any) {
      setErr(e.message);
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{syl.title}</h1>
          <div className="text-sm text-slate-500 mt-1">
            {syl.courseCode && <>Mã: {syl.courseCode} • </>}
            {syl.credits != null && <>{syl.credits} TC • </>}
            {syl.program && <>{syl.program} • </>}
            {syl.level}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            className="btn-secondary"
            href={`/api/export/${syl.id}?format=docx`}
            target="_blank"
            rel="noreferrer"
          >
            Tải DOCX
          </a>
          <a
            className="btn-secondary"
            href={`/api/export/${syl.id}?format=pdf`}
            target="_blank"
            rel="noreferrer"
          >
            Tải PDF
          </a>
          <button
            className="btn-primary"
            disabled={busy === 'evaluate'}
            onClick={evaluate}
          >
            {busy === 'evaluate' ? 'AI đang đánh giá...' : 'Đánh giá bằng AI'}
          </button>
          <button className="btn-danger" disabled={!!busy} onClick={remove}>
            Xóa
          </button>
        </div>
      </div>

      {err && (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <TabBtn active={tab === 'content'} onClick={() => setTab('content')}>
          Nội dung
        </TabBtn>
        <TabBtn active={tab === 'evaluation'} onClick={() => setTab('evaluation')}>
          Đánh giá {latest && <ScorePill score={latest.overallScore} />}
        </TabBtn>
        <TabBtn active={tab === 'revise'} onClick={() => setTab('revise')}>
          Chỉnh sửa AI
        </TabBtn>
      </div>

      {tab === 'content' && (
        <div className="card space-y-3">
          {!editing ? (
            <>
              <div className="flex justify-end">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setDraft(syl);
                    setEditing(true);
                  }}
                >
                  Chỉnh sửa
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-slate-800">
                {syl.content}
              </pre>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tên học phần</label>
                  <input
                    className="input"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Mã học phần</label>
                  <input
                    className="input"
                    value={draft.courseCode || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, courseCode: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Số tín chỉ</label>
                  <input
                    className="input"
                    type="number"
                    value={draft.credits ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        credits: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Trình độ</label>
                  <input
                    className="input"
                    value={draft.level || ''}
                    onChange={(e) => setDraft({ ...draft, level: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Chương trình</label>
                  <input
                    className="input"
                    value={draft.program || ''}
                    onChange={(e) =>
                      setDraft({ ...draft, program: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="label">Nội dung</label>
                <textarea
                  className="textarea min-h-[400px]"
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn-primary"
                  disabled={busy === 'save'}
                  onClick={saveEdits}
                >
                  {busy === 'save' ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'evaluation' && (
        <div className="space-y-4">
          {!latest && (
            <div className="card text-slate-500 text-sm">
              Chưa có kết quả đánh giá. Bấm <strong>Đánh giá bằng AI</strong> để
              bắt đầu.
            </div>
          )}
          {latest && <EvaluationView evaluation={latest} history={evals} />}
        </div>
      )}

      {tab === 'revise' && (
        <div className="space-y-4">
          {!latest && (
            <div className="card text-slate-500 text-sm">
              Cần đánh giá đề cương trước khi chỉnh sửa AI.
            </div>
          )}
          {latest && (
            <div className="card space-y-3">
              <div>
                <label className="label">Yêu cầu chỉnh sửa thêm (tùy chọn)</label>
                <textarea
                  className="textarea min-h-[120px]"
                  value={reviseInstructions}
                  onChange={(e) => setReviseInstructions(e.target.value)}
                  placeholder="VD: bổ sung CLO cho phần thực hành; tăng tỷ trọng dự án; ..."
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  className="btn-secondary"
                  disabled={busy === 'revise'}
                  onClick={() => revise(false)}
                >
                  Tạo bản chỉnh sửa (xem trước)
                </button>
                <button
                  className="btn-primary"
                  disabled={busy === 'revise'}
                  onClick={() => revise(true)}
                >
                  Tạo & áp dụng vào đề cương
                </button>
              </div>
              {busy === 'revise' && (
                <div className="text-xs text-slate-500">
                  AI đang viết lại đề cương...
                </div>
              )}
              {reviseResult && (
                <div className="space-y-3 mt-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">
                      Các thay đổi chính
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {reviseResult.changeLog.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">
                      Bản đề cương đề xuất
                    </h3>
                    <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed bg-slate-50 border border-slate-200 rounded-md p-3">
                      {reviseResult.revised}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`px-4 py-2 text-sm border-b-2 -mb-px flex items-center gap-2 ${
        active
          ? 'border-brand-600 text-brand-700 font-medium'
          : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span className={`score-pill ${scoreColor(score)}`}>{score.toFixed(1)}</span>
  );
}

function EvaluationView({
  evaluation,
  history,
}: {
  evaluation: EvalRecord;
  history: EvalRecord[];
}) {
  return (
    <>
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500">Điểm tổng quát</div>
          <div className="text-3xl font-semibold flex items-center gap-3">
            <ScorePill score={evaluation.overallScore} />
            <span className="text-slate-400 text-base font-normal">
              / 5 (model {evaluation.model})
            </span>
          </div>
        </div>
        {history.length > 1 && (
          <div className="text-xs text-slate-500">
            Lịch sử đánh giá: {history.length} bản
          </div>
        )}
      </div>

      {evaluation.topSuggestions.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-2">Top gợi ý chỉnh sửa</h3>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-700">
            {evaluation.topSuggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4">
        {evaluation.groups.map((g) => (
          <div key={g.groupId} className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{g.groupName}</h3>
              <ScorePill score={g.averageScore} />
            </div>
            {g.summary && (
              <p className="text-sm text-slate-600 mb-3">{g.summary}</p>
            )}
            <div className="grid gap-2">
              {g.scores.map((s) => (
                <div
                  key={s.criterionId}
                  className="border border-slate-200 rounded-md p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className={`score-pill ${scoreColor(s.score)}`}>
                      {s.score}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {s.criterionText}
                      </div>
                      {s.comment && (
                        <p className="text-sm text-slate-600 mt-1">
                          {s.comment}
                        </p>
                      )}
                      {s.suggestions.length > 0 && (
                        <ul className="list-disc pl-5 text-sm text-slate-700 mt-1 space-y-0.5">
                          {s.suggestions.map((sg, i) => (
                            <li key={i}>{sg}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {g.prioritizedRevisions.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-sm mb-1">
                  Ưu tiên chỉnh sửa
                </h4>
                <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-0.5">
                  {g.prioritizedRevisions.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
