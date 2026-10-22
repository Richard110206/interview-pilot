import service from "@/lib/request";
import type { AxiosRequestConfig } from "axios";

const LONG_TIMEOUT_MS = 600000;

export interface QuestionBankItem {
  id: number;
  category: string;
  skillTag: string;
  difficulty: number;
  questionType: string;
  questionText: string;
  referenceAnswer?: string | null;
  scoringPoints?: string[];
  status: number;
  source?: string | null;
  createTime?: string;
  updateTime?: string;
}

export interface QuestionBankPageParams {
  pageNum?: number;
  pageSize?: number;
  category?: string;
  skillTag?: string;
  difficulty?: number;
  status?: number;
  keyword?: string;
}

export interface QuestionBankPageResult {
  records?: QuestionBankItem[];
  total?: number;
  size?: number;
  current?: number;
  pages?: number;
}

export interface QuestionBankSearchHit {
  id: number;
  score: number;
  category: string;
  skillTag: string;
  difficulty: number;
  questionText: string;
}

export interface QuestionBankSaveParams {
  id?: number;
  category: string;
  skillTag: string;
  difficulty: number;
  questionType: string;
  questionText: string;
  referenceAnswer?: string;
  scoringPoints?: string[];
  status: number;
  source?: string;
}

export interface QuestionBankExpandParams {
  category: string;
  skillTag: string;
  count?: number;
}

export interface QuestionBankExpandResult {
  searched: number;
  generated: number;
  inserted: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  note: string;
}

export const questionBankService = {
  pageQuestions: async (params: QuestionBankPageParams) => {
    return service.get<QuestionBankPageResult>(
      "/xunzhi/v1/interview/question-bank/page",
      { params },
    );
  },

  getQuestion: async (id: number) => {
    return service.get<QuestionBankItem>(
      `/xunzhi/v1/interview/question-bank/${id}`,
    );
  },

  saveOrUpdate: async (params: QuestionBankSaveParams) => {
    return service.post<number>("/xunzhi/v1/interview/question-bank", params);
  },

  updateStatus: async (id: number, status: number) => {
    return service.post<null>(
      `/xunzhi/v1/interview/question-bank/${id}/status`,
      { status },
    );
  },

  deleteQuestion: async (id: number) => {
    return service.post<null>(
      `/xunzhi/v1/interview/question-bank/${id}/delete`,
    );
  },

  searchQuestions: async (query: string, topK?: number) => {
    return service.get<QuestionBankSearchHit[]>(
      "/xunzhi/v1/interview/question-bank/search",
      { params: { query, topK } },
    );
  },

  countByCategory: async () => {
    return service.get<Record<string, number>>(
      "/xunzhi/v1/interview/question-bank/categories",
    );
  },

  countBySkillTag: async (category?: string) => {
    return service.get<Record<string, number>>(
      "/xunzhi/v1/interview/question-bank/skill-tags",
      { params: { category } },
    );
  },

  rebuildIndex: async () => {
    return service.post<number>(
      "/xunzhi/v1/interview/question-bank/rebuild-index",
      undefined,
      { timeout: LONG_TIMEOUT_MS } satisfies AxiosRequestConfig,
    );
  },

  expand: async (params: QuestionBankExpandParams) => {
    return service.post<QuestionBankExpandResult>(
      "/xunzhi/v1/interview/question-bank/expand",
      params,
      { timeout: LONG_TIMEOUT_MS } satisfies AxiosRequestConfig,
    );
  },
};
