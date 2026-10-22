import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeWorkspace } from "./LearningPage";
import { learningService, type StudyItem } from "@/services/learningService";
vi.mock("@/services/learningService", () => ({
  learningService: {
    attempts: vi.fn().mockResolvedValue([]),
    submit: vi.fn(),
    favorite: vi.fn(),
  },
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const item: StudyItem = {
  id: "one",
  sessionId: "s",
  questionNumber: "1",
  question: "缓存穿透是什么？",
  answer: "",
  feedback: "",
  latestScore: 20,
  favorite: false,
  sources: [],
  dimensions: {},
  policy: "text-v1",
  updatedAt: 0,
};
describe("PracticeWorkspace", () => {
  it("keeps the request identity when retrying a failed answer", async () => {
    const submit = vi.mocked(learningService.submit);
    submit
      .mockRejectedValueOnce(new Error("网络暂不可用"))
      .mockResolvedValue({
        score: 80,
        feedback: "基础正确",
        dimensions: {
          accuracy: 80,
          completeness: 80,
          reasoning: 80,
          expression: 80,
        },
        missing_points: [],
        recordedAt: 1,
        grading_policy: "text-v1",
      });
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={client}>
        <PracticeWorkspace item={item} />
      </QueryClientProvider>,
    );
    fireEvent.change(screen.getByLabelText("这一次，你会怎样回答？"), {
      target: {
        value: "空结果请求绕过缓存访问数据库，可用空值缓存和布隆过滤器。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交练习回答" }));
    await screen.findByRole("button", { name: "重试本次评分" });
    fireEvent.click(screen.getByRole("button", { name: "重试本次评分" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(2));
    expect(submit.mock.calls[0][2]).toBe(submit.mock.calls[1][2]);
    await screen.findByText("基础正确");
    fireEvent.change(screen.getByLabelText("这一次，你会怎样回答？"), {
      target: { value: "新的回答" },
    });
    fireEvent.click(screen.getByRole("button", { name: "提交练习回答" }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(3));
    expect(submit.mock.calls[2][2]).not.toBe(submit.mock.calls[0][2]);
  });
});
