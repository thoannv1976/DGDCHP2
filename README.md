# AI Đánh giá Đề cương Học phần (DGDCHP2)

Ứng dụng Next.js dùng AI (Anthropic Claude) để chấm điểm, đánh giá, gợi ý và **chỉnh sửa tự động** đề cương học phần đại học theo bộ tiêu chí 5 nhóm đối tượng:

1. Ban lãnh đạo khoa/trường
2. Trưởng ngành / Chủ nhiệm chương trình đào tạo
3. Trưởng bộ môn / Hội đồng chuyên môn
4. Doanh nghiệp / Nhà tuyển dụng / Chuyên gia thực tiễn
5. Tổ chức kiểm định & đảm bảo chất lượng

Mỗi nhóm gồm 10 tiêu chí, được mã hóa trong `src/lib/criteria.ts`.

## Tính năng

- Tải lên đề cương (DOCX, PDF, TXT, Markdown) hoặc dán văn bản trực tiếp.
- AI chấm điểm 1–5 cho từng tiêu chí, kèm nhận xét và 1–3 gợi ý chỉnh sửa.
- Tổng hợp ưu tiên chỉnh sửa theo từng nhóm và top gợi ý chung.
- AI **chỉnh sửa tự động** đề cương theo các góp ý đã chấm + chỉ dẫn người dùng.
- Lưu trữ đề cương & lịch sử đánh giá vào **Firebase Firestore**.
- Chỉnh sửa, cập nhật metadata và nội dung đề cương.
- Tải xuống bản **DOCX** và **PDF** (kèm hoặc không kèm kết quả đánh giá).

## Stack

- Next.js 14 (App Router) + TypeScript + TailwindCSS
- Anthropic Claude API (`@anthropic-ai/sdk`, mặc định `claude-opus-4-7`)
- Firebase Firestore (lưu trữ qua `firebase-admin`)
- Trích xuất văn bản: `mammoth` (DOCX), `pdf-parse` (PDF)
- Xuất file: `docx`, `pdfkit`
- Chạy production: Docker (output `standalone`) → Google Cloud Run
- CI/CD: Google Cloud Build (xem `cloudbuild.yaml`)

## Cấu hình môi trường

Sao chép `.env.example` thành `.env.local` và điền:

```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-7

# Firebase client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server)
# Khi deploy lên Cloud Run, gán Service Account có quyền Firestore vào dịch vụ thay vì paste JSON.
FIREBASE_PROJECT_ID=...
# (tuỳ chọn) FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

## Phát triển local

```bash
npm install
npm run dev      # http://localhost:3000
npm run typecheck
npm run build
```

## Deploy

### Cloud Run + Cloud Build

1. Tạo project Firebase, bật Firestore (Native mode).
2. Tạo Service Account có quyền `roles/datastore.user` và gán cho Cloud Run.
3. Lưu `ANTHROPIC_API_KEY` vào Secret Manager.
4. Cấu hình Cloud Build trigger trên repo (xem `cloudbuild.yaml`).

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_SERVICE=syllabus-evaluator,_REGION=asia-southeast1
```

### Firestore rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Cấu trúc thư mục

```
src/
  app/
    api/
      criteria/route.ts        GET danh sách bộ tiêu chí
      syllabi/route.ts         GET list, POST tạo mới
      syllabi/[id]/route.ts    GET, PATCH, DELETE
      upload/route.ts          POST (multipart) -> trích xuất text từ DOCX/PDF
      evaluate/route.ts        POST {syllabusId} -> AI chấm + lưu evaluation
      revise/route.ts          POST {syllabusId, evaluationId, instructions, applyToSyllabus}
      export/[id]/route.ts     GET ?format=docx|pdf -> tải file
    page.tsx                   Trang danh sách
    new/page.tsx               Tạo mới + upload
    syllabus/[id]/page.tsx     Trang chi tiết: nội dung / đánh giá / chỉnh sửa AI
  lib/
    criteria.ts                Bộ tiêu chí 5 nhóm × 10 tiêu chí
    claude.ts                  Khởi tạo Claude SDK + extractJson
    evaluator.ts               Chấm điểm song song 5 nhóm + revise
    firebase.ts                Firebase client SDK
    firebase-admin.ts          Firebase Admin SDK (server)
    repo.ts                    Firestore repository
    parseFile.ts               Trích văn bản DOCX/PDF/TXT
    exporters.ts               Sinh DOCX & PDF
    types.ts
```

## Mô hình dữ liệu Firestore

- `syllabi/{id}`: `{ title, courseCode, credits, program, level, content, originalFileName, latestEvaluationId, createdAt, updatedAt }`
- `evaluations/{id}`: `{ syllabusId, overallScore, model, groups: [{ groupId, groupName, averageScore, scores:[{criterionId,criterionText,score,comment,suggestions}], summary, prioritizedRevisions }], topSuggestions, createdAt, updatedAt }`
