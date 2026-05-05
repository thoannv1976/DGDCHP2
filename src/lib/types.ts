import type { CriterionGroupId } from './criteria';

export interface CriterionScore {
  criterionId: string;
  criterionText: string;
  score: number; // 1..5
  comment: string;
  suggestions: string[];
}

export interface GroupEvaluation {
  groupId: CriterionGroupId;
  groupName: string;
  averageScore: number;
  scores: CriterionScore[];
  summary: string;
  prioritizedRevisions: string[];
}

export interface Evaluation {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  overallScore: number;
  groups: GroupEvaluation[];
  topSuggestions: string[];
  model: string;
}

export interface SyllabusDoc {
  id?: string;
  title: string;
  courseCode?: string;
  credits?: number;
  program?: string;
  level?: string;
  content: string; // plain-text source of truth
  originalFileName?: string;
  createdAt?: string;
  updatedAt?: string;
  latestEvaluationId?: string;
}
