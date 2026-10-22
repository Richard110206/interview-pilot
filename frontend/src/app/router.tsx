import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import AppLayout from "@/layouts/AppLayout";
import { ROUTES } from "@/lib/constants";

const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const MarketingHomePage = lazy(
  () => import("@/pages/marketing/MarketingHomePage"),
);
const ChatPage = lazy(() => import("@/pages/chat/ChatPage"));
const InterviewIntroPage = lazy(
  () => import("@/pages/interview/InterviewIntroPage"),
);
const InterviewPage = lazy(() => import("@/pages/interview/InterviewPage"));
const InterviewReportPage = lazy(
  () => import("@/pages/interview/InterviewReportPage"),
);
const InterviewReportDetailPage = lazy(
  () => import("@/pages/interview/InterviewReportDetailPage"),
);
const QuestionBankPage = lazy(
  () => import("@/pages/questionbank/QuestionBankPage"),
);
const QuestionBankManagePage = lazy(
  () => import("@/pages/questionbank/QuestionBankManagePage"),
);
const KnowledgePage = lazy(() => import("@/pages/knowledge/KnowledgePage"));
const AccountPage = lazy(() => import("@/pages/account/AccountPage"));
const LearningPage = lazy(() => import("@/pages/learning/LearningPage"));

function RouteLoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-sheet">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const withRouteSuspense = (node: ReactNode) => (
  <Suspense fallback={<RouteLoadingScreen />}>{node}</Suspense>
);

export const appRoutes: RouteObject[] = [
  {
    path: ROUTES.home,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: withRouteSuspense(<MarketingHomePage />),
      },
      {
        path: ROUTES.auth,
        element: withRouteSuspense(<AuthPage />),
      },
      {
        element: <AuthGuard />,
        children: [
          {
            path: ROUTES.account,
            element: withRouteSuspense(<AccountPage />),
          },
          {
            path: ROUTES.learning,
            element: withRouteSuspense(<LearningPage />),
          },
          {
            path: ROUTES.interviewIntro,
            element: withRouteSuspense(<InterviewIntroPage />),
          },
          {
            path: ROUTES.interviewRoom,
            element: withRouteSuspense(<InterviewPage />),
          },
          {
            path: `${ROUTES.interviewRoom}/:sessionId`,
            element: withRouteSuspense(<InterviewPage />),
          },
          {
            path: ROUTES.interviewReport,
            element: withRouteSuspense(<InterviewReportPage />),
          },
          {
            path: ROUTES.interviewReportDetail,
            element: withRouteSuspense(<InterviewReportDetailPage />),
          },
          {
            path: `${ROUTES.chat}/:sessionId?`,
            element: withRouteSuspense(<ChatPage />),
          },
          {
            path: ROUTES.questionBank,
            element: withRouteSuspense(<QuestionBankPage />),
          },
          {
            path: ROUTES.questionBankManage,
            element: withRouteSuspense(<QuestionBankManagePage />),
          },
          {
            path: ROUTES.knowledge,
            element: withRouteSuspense(<KnowledgePage />),
          },
        ],
      },
    ],
  },
];

export const appRouter = createBrowserRouter(appRoutes);
