import 'server-only';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  AlignmentType,
} from 'docx';
import PDFDocument from 'pdfkit';
import type { Evaluation, SyllabusDoc } from './types';

function paragraphsFromText(text: string): Paragraph[] {
  return text.split(/\r?\n/).map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line })],
        spacing: { after: 120 },
      }),
  );
}

export async function syllabusToDocx(
  syl: SyllabusDoc,
  evaluation?: Evaluation | null,
): Promise<Buffer> {
  const sections: Paragraph[] = [
    new Paragraph({
      text: syl.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
  ];

  const meta: string[] = [];
  if (syl.courseCode) meta.push(`Mã học phần: ${syl.courseCode}`);
  if (syl.credits != null) meta.push(`Số tín chỉ: ${syl.credits}`);
  if (syl.program) meta.push(`Chương trình: ${syl.program}`);
  if (syl.level) meta.push(`Trình độ: ${syl.level}`);
  if (meta.length) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: meta.join(' • '), italics: true })],
        spacing: { after: 200 },
      }),
    );
  }

  sections.push(
    new Paragraph({
      text: 'Nội dung đề cương',
      heading: HeadingLevel.HEADING_1,
    }),
    ...paragraphsFromText(syl.content),
  );

  if (evaluation) {
    sections.push(
      new Paragraph({
        text: 'Kết quả đánh giá',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Điểm tổng quát: ${evaluation.overallScore}/5  (model: ${evaluation.model})`,
            bold: true,
          }),
        ],
        spacing: { after: 200 },
      }),
    );
    for (const g of evaluation.groups) {
      sections.push(
        new Paragraph({
          text: `${g.groupName} — ${g.averageScore}/5`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({ text: g.summary, spacing: { after: 120 } }),
      );
      for (const s of g.scores) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[${s.score}/5] ${s.criterionText}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: s.comment, spacing: { after: 80 } }),
        );
        for (const sg of s.suggestions) {
          sections.push(
            new Paragraph({
              text: `• ${sg}`,
              indent: { left: 360 },
              spacing: { after: 60 },
            }),
          );
        }
      }
      if (g.prioritizedRevisions.length) {
        sections.push(
          new Paragraph({
            text: 'Ưu tiên chỉnh sửa:',
            heading: HeadingLevel.HEADING_3,
          }),
        );
        for (const r of g.prioritizedRevisions) {
          sections.push(
            new Paragraph({
              text: `• ${r}`,
              indent: { left: 360 },
              spacing: { after: 60 },
            }),
          );
        }
      }
    }
  }

  const doc = new Document({
    creator: 'AI Syllabus Evaluator',
    title: syl.title,
    sections: [{ children: sections }],
  });
  return Packer.toBuffer(doc);
}

export async function syllabusToPdf(
  syl: SyllabusDoc,
  evaluation?: Evaluation | null,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(syl.title, { align: 'center' });
    doc.moveDown(0.5);

    const meta: string[] = [];
    if (syl.courseCode) meta.push(`Mã học phần: ${syl.courseCode}`);
    if (syl.credits != null) meta.push(`Số tín chỉ: ${syl.credits}`);
    if (syl.program) meta.push(`Chương trình: ${syl.program}`);
    if (syl.level) meta.push(`Trình độ: ${syl.level}`);
    if (meta.length) {
      doc.fontSize(10).fillColor('#444').text(meta.join(' • '), { align: 'center' });
      doc.fillColor('#000');
    }
    doc.moveDown(1);

    doc.fontSize(14).text('Nội dung đề cương', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(syl.content);

    if (evaluation) {
      doc.addPage();
      doc.fontSize(16).text('Kết quả đánh giá');
      doc.moveDown(0.5);
      doc
        .fontSize(11)
        .text(`Điểm tổng quát: ${evaluation.overallScore}/5 (model: ${evaluation.model})`);
      doc.moveDown(0.5);

      for (const g of evaluation.groups) {
        doc.moveDown(0.5);
        doc.fontSize(13).text(`${g.groupName} — ${g.averageScore}/5`);
        doc.fontSize(10).fillColor('#333').text(g.summary);
        doc.fillColor('#000');
        doc.moveDown(0.3);
        for (const s of g.scores) {
          doc.fontSize(11).text(`[${s.score}/5] ${s.criterionText}`, {
            continued: false,
          });
          if (s.comment) doc.fontSize(10).fillColor('#333').text(s.comment);
          doc.fillColor('#000');
          for (const sg of s.suggestions) {
            doc.fontSize(10).text(`  • ${sg}`);
          }
        }
        if (g.prioritizedRevisions.length) {
          doc.moveDown(0.3);
          doc.fontSize(11).text('Ưu tiên chỉnh sửa:');
          for (const r of g.prioritizedRevisions) {
            doc.fontSize(10).text(`  • ${r}`);
          }
        }
      }
    }

    doc.end();
  });
}
