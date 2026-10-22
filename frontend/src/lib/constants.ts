export const ROUTES = {
  home: "/",
  interviewIntro: "/interview",
  interviewRoom: "/interview/room",
  interviewReport: "/interview/report",
  interviewReportDetail: "/interview/report/detail",
  chat: "/chat",
  questionBank: "/question-bank",
  questionBankManage: "/question-bank/manage",
  knowledge: "/knowledge",
  auth: "/auth",
  account: "/account",
  learning: "/learning",
} as const;

export const CHAT_ROLES = {
  user: "user",
  assistant: "assistant",
} as const;

export type ChatRole = (typeof CHAT_ROLES)[keyof typeof CHAT_ROLES];

export const INTERVIEW_DEFAULTS = {
  initialMessageId: "1",
  assistantWelcomeMessage:
    "你好！你可以上传 PDF 简历，或直接发送公开 GitHub 仓库链接，并说明想练习的模块。我会依据实际资料提问，再穿插技术原理与场景追问。",
  assistantFollowupMessage:
    "收到你的回答。这是一个很好的切入点，但你能更详细地解释一下具体实现细节吗？",
  aiReplyDelayMs: 1500,
  resumeAccept: ".pdf",
} as const;

export const MEDIA_TARGETS = {
  camera: "camera",
  microphone: "microphone",
} as const;

export type MediaTarget = (typeof MEDIA_TARGETS)[keyof typeof MEDIA_TARGETS];
