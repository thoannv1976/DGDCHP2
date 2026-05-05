import 'server-only';
import { adminDb, FieldValue } from './firebase-admin';
import type { Evaluation, SyllabusDoc } from './types';

const SYL = 'syllabi';
const EVAL = 'evaluations';

function nowIso() {
  return new Date().toISOString();
}

export async function createSyllabus(
  data: Omit<SyllabusDoc, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<SyllabusDoc> {
  const db = adminDb();
  const doc = {
    ...data,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const ref = await db.collection(SYL).add(doc);
  return { id: ref.id, ...doc };
}

export async function updateSyllabus(
  id: string,
  patch: Partial<SyllabusDoc>,
): Promise<void> {
  const db = adminDb();
  await db
    .collection(SYL)
    .doc(id)
    .set({ ...patch, updatedAt: nowIso() }, { merge: true });
}

export async function getSyllabus(id: string): Promise<SyllabusDoc | null> {
  const db = adminDb();
  const snap = await db.collection(SYL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as SyllabusDoc) };
}

export async function listSyllabi(): Promise<SyllabusDoc[]> {
  const db = adminDb();
  const snap = await db
    .collection(SYL)
    .orderBy('updatedAt', 'desc')
    .limit(200)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as SyllabusDoc) }));
}

export async function deleteSyllabus(id: string): Promise<void> {
  const db = adminDb();
  await db.collection(SYL).doc(id).delete();
  const evals = await db
    .collection(EVAL)
    .where('syllabusId', '==', id)
    .get();
  await Promise.all(evals.docs.map((d) => d.ref.delete()));
}

export async function saveEvaluation(
  syllabusId: string,
  evaluation: Evaluation,
): Promise<string> {
  const db = adminDb();
  const doc = {
    ...evaluation,
    syllabusId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const ref = await db.collection(EVAL).add(doc);
  await db
    .collection(SYL)
    .doc(syllabusId)
    .set({ latestEvaluationId: ref.id, updatedAt: nowIso() }, { merge: true });
  return ref.id;
}

export async function getEvaluation(
  id: string,
): Promise<(Evaluation & { syllabusId: string }) | null> {
  const db = adminDb();
  const snap = await db.collection(EVAL).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Evaluation & { syllabusId: string }) };
}

export async function listEvaluationsForSyllabus(
  syllabusId: string,
): Promise<(Evaluation & { id: string })[]> {
  const db = adminDb();
  const snap = await db
    .collection(EVAL)
    .where('syllabusId', '==', syllabusId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Evaluation) }));
}

export const _internal = { FieldValue };
