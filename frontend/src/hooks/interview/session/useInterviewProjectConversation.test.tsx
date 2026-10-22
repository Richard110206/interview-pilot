import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInterviewProjectConversation } from "./useInterviewProjectConversation";

const mock = vi.hoisted(() => ({
  read: vi.fn(),
  submit: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@/services/interviewService", () => ({
  interviewService: { createInterviewSession: mock.create },
}));
vi.mock("@/services/interviewProjectService", () => ({
  interviewProjectService: { read: mock.read, submit: mock.submit },
  projectBusy: (v: { status: string } | null) =>
    Boolean(v && !["READY", "FAILED"].includes(v.status)),
}));
const job = {
  id: "s",
  jobId: "job",
  message: "https://github.com/acme/demo",
  status: "READY",
  repositoryUrl: "https://github.com/acme/demo",
  commitSha: "a".repeat(40),
  fileCount: 2,
  chunkCount: 4,
  skippedFiles: 0,
  questionsPrepared: true,
};
const options = () => ({
  sessionId: null as string | null,
  questionNumber: null as string | null,
  setSessionId: vi.fn(),
  appendUser: vi.fn(),
  appendSystem: vi.fn(),
  appendError: vi.fn(),
  syncQuestion: vi.fn().mockResolvedValue(undefined),
});

describe("GitHub messages in the existing interview conversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock.read.mockResolvedValue(null);
    mock.create.mockResolvedValue({ sessionId: "s" });
    mock.submit.mockResolvedValue({ ...job, status: "FETCHING" });
  });
  it("creates the session and submits the same message without an extra form", async () => {
    const opts = options();
    const { result } = renderHook(() => useInterviewProjectConversation(opts));
    await act(async () => {
      await result.current.submit(job.message);
    });
    expect(mock.create).toHaveBeenCalledTimes(1);
    expect(mock.submit).toHaveBeenCalledWith("s", job.message);
    expect(opts.setSessionId).toHaveBeenCalledWith("s");
  });
  it("restores a completed import and loads its current question once", async () => {
    mock.read.mockResolvedValue(job);
    const opts = { ...options(), sessionId: "s" };
    const { rerender } = renderHook(() =>
      useInterviewProjectConversation(opts),
    );
    await waitFor(() => expect(opts.syncQuestion).toHaveBeenCalledTimes(1));
    rerender();
    expect(opts.appendUser).toHaveBeenCalledWith(job.message);
    expect(mock.submit).not.toHaveBeenCalled();
    expect(opts.syncQuestion).toHaveBeenCalledTimes(1);
  });
  it("does not advance an existing question when a repository is attached", async () => {
    mock.read.mockResolvedValue({ ...job, questionsPrepared: false });
    const opts = { ...options(), sessionId: "s", questionNumber: "2" };
    renderHook(() => useInterviewProjectConversation(opts));
    await waitFor(() => expect(opts.appendSystem).toHaveBeenCalled());
    expect(opts.syncQuestion).not.toHaveBeenCalled();
    expect(mock.create).not.toHaveBeenCalled();
  });
  it("shows import failures and allows resending the link", async () => {
    mock.read.mockResolvedValue({
      ...job,
      status: "FAILED",
      error: "仓库不存在",
    });
    const opts = { ...options(), sessionId: "s" };
    const { result } = renderHook(() => useInterviewProjectConversation(opts));
    await waitFor(() =>
      expect(opts.appendError).toHaveBeenCalledWith(
        expect.stringContaining("仓库不存在"),
      ),
    );
    await act(async () => {
      await result.current.submit(job.message);
    });
    expect(mock.submit).toHaveBeenCalledWith("s", job.message);
    expect(mock.create).not.toHaveBeenCalled();
  });
});
