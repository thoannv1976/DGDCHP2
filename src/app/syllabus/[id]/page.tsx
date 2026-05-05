import { notFound } from 'next/navigation';
import { getSyllabus, listEvaluationsForSyllabus } from '@/lib/repo';
import SyllabusDetail from './SyllabusDetail';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const syl = await getSyllabus(params.id);
  if (!syl) notFound();
  const evaluations = await listEvaluationsForSyllabus(params.id);
  return <SyllabusDetail initialSyllabus={syl} initialEvaluations={evaluations} />;
}
