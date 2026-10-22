import service from "@/lib/request";

export type ProjectImport = {
  id: string;
  jobId: string;
  message: string;
  repositoryUrl?: string;
  commitSha?: string;
  status:
    | "QUEUED"
    | "FETCHING"
    | "INDEXING"
    | "GENERATING"
    | "READY"
    | "FAILED";
  error?: string;
  fileCount: number;
  skippedFiles: number;
  chunkCount: number;
  questionsPrepared: boolean;
};
export const isGitHubMessage = (message: string) =>
  /https:\/\/github\.com\//i.test(message);
export const projectBusy = (project: ProjectImport | null) =>
  Boolean(project && !["READY", "FAILED"].includes(project.status));
export const interviewProjectService = {
  read: (session: string) =>
    service.get<ProjectImport | null>(
      `/xunzhi/v1/interview/sessions/${encodeURIComponent(session)}/project`,
    ),
  submit: (session: string, message: string) =>
    service.post<ProjectImport>(
      `/xunzhi/v1/interview/sessions/${encodeURIComponent(session)}/project/messages`,
      { message },
    ),
};
