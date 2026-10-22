import service from "@/lib/request";
export type Source = {
  kind: string;
  id: string;
  title: string;
  content: string;
  referenceAnswer?: string;
  scoringPoints?: string;
  sourceNote?: string;
  documentId?: number;
  pageStart?: number;
  pageEnd?: number;
  repositoryUrl?: string;
  commitSha?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  sourceUrl?: string;
};
export type Dimension = {
  key: string;
  label: string;
  value: number;
  weight: number;
};
export type EvidenceQuestion = {
  questionNumber: string;
  question: string;
  answer?: string;
  score: number | null;
  feedback?: string;
  followUp: boolean;
  dimensions: Record<string, number>;
  sources: Source[];
  origin: string;
  itemId?: string;
  favorite?: boolean;
};
export type Insights = {
  sessionId: string;
  questions: EvidenceQuestion[];
  dimensions: Dimension[];
  primaryCount: number;
  dimensionCoverage: number;
  interviewScore: number | null;
  compositeScore: number | null;
  gradingPolicy: string;
  gradingPolicyText: string;
};
export type StudyItem = {
  id: string;
  sessionId: string;
  questionNumber: string;
  question: string;
  answer: string;
  feedback: string;
  latestScore: number | null;
  favorite: boolean;
  sources: Source[];
  dimensions: Record<string, number>;
  policy: string;
  updatedAt: number;
};
export type PracticeResult = {
  score: number;
  feedback: string;
  dimensions: Record<string, number>;
  missing_points: string[];
  previousScore?: number;
  recordedAt: number;
  grading_policy: string;
};
export type PracticeAttempt = {
  id: string;
  createdAt: number;
  resultJson: string;
};
export type SessionComparison = {
  sessionId: string;
  date: string;
  direction?: string;
  interviewScore: number;
  compositeScore: number;
  primaryCount: number;
  gradingPolicy: string;
  dimensions: Dimension[];
};
const root = "/xunzhi/v1/interview";
export const learningService = {
  insights: (id: string) =>
    service.get<Insights>(
      `${root}/sessions/${encodeURIComponent(id)}/insights`,
    ),
  items: (filter: string) =>
    service.get<StudyItem[]>(`${root}/learning/items`, { params: { filter } }),
  item: (id: string) =>
    service.get<StudyItem>(`${root}/learning/items/${encodeURIComponent(id)}`),
  favorite: (id: string, favorite: boolean) =>
    service.put<StudyItem>(
      `${root}/learning/items/${encodeURIComponent(id)}/favorite`,
      { favorite },
    ),
  favoriteBank: (id: number) =>
    service.post<StudyItem>(`${root}/learning/question-bank/${id}/favorite`),
  history: () => service.get<SessionComparison[]>(`${root}/learning/history`),
  attempts: (id: string) =>
    service.get<PracticeAttempt[]>(
      `${root}/learning/items/${encodeURIComponent(id)}/attempts`,
    ),
  submit: (id: string, answer: string, requestId: string) =>
    service.post<PracticeResult>(
      `${root}/learning/items/${encodeURIComponent(id)}/attempts`,
      { answer, requestId },
    ),
};
