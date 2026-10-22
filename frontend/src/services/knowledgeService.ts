import service from "@/lib/request";
import type { AxiosRequestConfig } from "axios";

const UPLOAD_TIMEOUT_MS = 600000;

export interface KnowledgeDocumentItem {
  id: number;
  title: string;
  fileName: string;
  category?: string | null;
  pageCount?: number | null;
  chunkCount: number;
  status: number;
  sourceNote?: string | null;
  createTime?: string;
  updateTime?: string;
}

export interface KnowledgeUploadResult {
  documentId: number;
  pages: number;
  chunks: number;
  vectorIndexed: boolean;
}

export interface KnowledgeSearchHit {
  chunkKey: string;
  documentId: number;
  heading: string;
  score: number;
  content: string;
}

export interface KnowledgeUploadParams {
  file: File;
  title?: string;
  category?: string;
  password?: string;
  sourceNote?: string;
}

export const knowledgeService = {
  uploadDocument: async (params: KnowledgeUploadParams) => {
    const formData = new FormData();
    formData.append("file", params.file);
    if (params.title) formData.append("title", params.title);
    if (params.category) formData.append("category", params.category);
    if (params.password) formData.append("password", params.password);
    if (params.sourceNote) formData.append("sourceNote", params.sourceNote);
    return service.post<KnowledgeUploadResult, FormData>(
      "/xunzhi/v1/interview/knowledge/documents",
      formData,
      {
        timeout: UPLOAD_TIMEOUT_MS,
        headers: { "Content-Type": "multipart/form-data" },
      } satisfies AxiosRequestConfig,
    );
  },

  listDocuments: async () => {
    return service.get<KnowledgeDocumentItem[]>(
      "/xunzhi/v1/interview/knowledge/documents",
    );
  },

  deleteDocument: async (id: number) => {
    return service.post<null>(
      `/xunzhi/v1/interview/knowledge/documents/${id}/delete`,
    );
  },

  searchKnowledge: async (query: string, topK?: number) => {
    return service.get<KnowledgeSearchHit[]>(
      "/xunzhi/v1/interview/knowledge/search",
      { params: { query, topK } },
    );
  },

  rebuildIndex: async () => {
    return service.post<number>(
      "/xunzhi/v1/interview/knowledge/rebuild-index",
      undefined,
      { timeout: UPLOAD_TIMEOUT_MS } satisfies AxiosRequestConfig,
    );
  },

  chunksPreview: async (id: number, limit = 5) => {
    return service.get<string>(
      `/xunzhi/v1/interview/knowledge/documents/${id}/chunks`,
      { params: { limit } },
    );
  },
};
