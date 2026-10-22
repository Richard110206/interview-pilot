import { useEffect, useRef, useState } from "react";
import { interviewService } from "@/services/interviewService";
import {
  interviewProjectService,
  projectBusy,
  type ProjectImport,
} from "@/services/interviewProjectService";

type Options = {
  sessionId: string | null;
  questionNumber: string | null;
  setSessionId: (id: string) => void;
  appendUser: (message: string) => void;
  appendSystem: (message: string) => void;
  appendError: (message: string) => void;
  syncQuestion: (session: string) => Promise<void>;
};
const stages: Record<string, string> = {
  QUEUED: "收到项目链接，正在等待读取。",
  FETCHING: "正在读取 GitHub 的指定版本源码。只分析代码，不运行项目。",
  INDEXING: "源码已获取，正在整理文件与代码片段。",
  GENERATING: "正在结合实际源码、题库和知识资料生成问题。",
};
export function useInterviewProjectConversation(options: Options) {
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const [project, setProject] = useState<ProjectImport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const announced = useRef(new Set<string>());
  const synced = useRef(new Set<string>());
  const submitLock = useRef(false);
  const lastReadError = useRef("");
  useEffect(() => {
    if (!options.sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const value = await interviewProjectService.read(options.sessionId!);
        if (cancelled) return;
        lastReadError.current = "";
        setProject(value);
        if (!value) return;
        const identity = value.jobId;
        if (!announced.current.has(identity)) {
          announced.current.add(identity);
          latest.current.appendUser(value.message);
        }
        const key = identity + value.status;
        if (!announced.current.has(key)) {
          announced.current.add(key);
          if (value.status === "FAILED")
            latest.current.appendError(
              `${value.error || "项目读取失败"}。可以重新发送相同链接重试。`,
            );
          else if (value.status === "READY") {
            latest.current.appendSystem(
              `已关联 ${value.repositoryUrl}，版本 ${value.commitSha?.slice(0, 12)}。已索引 ${value.fileCount} 个文件、${value.chunkCount} 个代码片段${value.skippedFiles ? `，另有 ${value.skippedFiles} 个候选文件未纳入` : ""}。后续问题与反馈会参考这个版本，源码引用可在报告中查看。`,
            );
          } else
            latest.current.appendSystem(
              stages[value.status] || "正在处理项目…",
            );
        }
        if (
          value.status === "READY" &&
          value.questionsPrepared &&
          !latest.current.questionNumber &&
          !synced.current.has(identity)
        ) {
          await latest.current.syncQuestion(options.sessionId!);
          synced.current.add(identity);
        }
        if (projectBusy(value)) timer = setTimeout(poll, 1200);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "项目状态暂时无法读取，稍后会重试";
        if (lastReadError.current !== message) {
          latest.current.appendError(message);
          lastReadError.current = message;
        }
        timer = setTimeout(poll, 5000);
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [options.sessionId, epoch]);

  const submit = async (message: string) => {
    if (submitLock.current || projectBusy(project)) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      const session =
        options.sessionId ||
        (await interviewService.createInterviewSession()).sessionId;
      const result = await interviewProjectService.submit(session, message);
      setProject(result);
      if (!options.sessionId) latest.current.setSessionId(session);
      else setEpoch((v) => v + 1);
      return true;
    } catch (error) {
      latest.current.appendError(
        error instanceof Error
          ? error.message
          : "项目读取未开始，请重新发送链接",
      );
      return false;
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };
  return { project, isBusy: submitting || projectBusy(project), submit };
}
