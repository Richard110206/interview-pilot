import { useInterviewCameraState } from "@/hooks/interview/camera/useInterviewCameraState";
import { useInterviewResumeAnalysis } from "@/hooks/interview/resume/useInterviewResumeAnalysis";
import { useInterviewSessionFlow } from "@/hooks/interview/session/useInterviewSessionFlow";
import { useAppSelector } from "@/store/hooks";
import { useInterviewProjectConversation } from "@/hooks/interview/session/useInterviewProjectConversation";
import { isGitHubMessage } from "@/services/interviewProjectService";

export function useInterviewPageController() {
  const { currentUser } = useAppSelector((state) => state.user);

  const sessionFlow = useInterviewSessionFlow(currentUser);
  const resumeAnalysis = useInterviewResumeAnalysis({
    interviewerSessionId: sessionFlow.interviewerSessionId,
    setInterviewerSessionId: sessionFlow.setInterviewerSessionId,
    syncNextQuestion: (sessionId) => sessionFlow.syncNextQuestion(sessionId),
    resetInterviewFlow: sessionFlow.resetInterviewFlow,
    clearInterviewError: sessionFlow.clearInterviewError,
  });
  const cameraState = useInterviewCameraState();
  const project = useInterviewProjectConversation({
    sessionId: sessionFlow.interviewerSessionId,
    questionNumber: sessionFlow.currentQuestionNumber,
    setSessionId: sessionFlow.setInterviewerSessionId,
    appendUser: sessionFlow.appendUserMessage,
    appendSystem: sessionFlow.appendSystemMessage,
    appendError: sessionFlow.appendErrorMessage,
    syncQuestion: sessionFlow.syncNextQuestion,
  });
  const handleConversationSend = async () => {
    if (
      project.isBusy ||
      sessionFlow.isInterviewSubmitting ||
      resumeAnalysis.isResumeUploading ||
      sessionFlow.isInterviewFinished
    )
      return;
    const message = sessionFlow.input.trim();
    if (!message) return;
    if (isGitHubMessage(message)) {
      if (await project.submit(message)) sessionFlow.setInput("");
    } else if (!sessionFlow.currentQuestionNumber) {
      sessionFlow.appendSystemMessage(
        "你可以上传 PDF 简历，或直接在这里发送公开 GitHub 仓库链接，并说明想练习的模块。",
      );
    } else await sessionFlow.handleSend();
  };

  return {
    chat: {
      messages: sessionFlow.messages,
      input: sessionFlow.input,
      setInput: sessionFlow.setInput,
      isReady:
        sessionFlow.isReady && Boolean(sessionFlow.currentQuestionNumber),
      isSubmitting: sessionFlow.isInterviewSubmitting || project.isBusy,
      handleSend: handleConversationSend,
    },
    project: { data: project.project, isBusy: project.isBusy },
    interview: {
      sessionId: sessionFlow.interviewerSessionId,
      error: sessionFlow.interviewError,
      isEnding: sessionFlow.isEndingInterview,
      currentQuestionNumber: sessionFlow.currentQuestionNumber,
      currentQuestionContent: sessionFlow.currentQuestionContent,
      isCurrentQuestionFollowUp: sessionFlow.isCurrentQuestionFollowUp,
      currentFollowUpCount: sessionFlow.currentFollowUpCount,
      isFinished: sessionFlow.isInterviewFinished,
      totalScore: sessionFlow.totalInterviewScore,
      handleEndInterview: sessionFlow.handleEndInterview,
    },
    resume: {
      fileInputRef: resumeAnalysis.fileInputRef,
      isUploading: resumeAnalysis.isResumeUploading,
      uploadStage: resumeAnalysis.resumeUploadStage,
      localFile: resumeAnalysis.resumeLocalFile,
      fileUrl: resumeAnalysis.resumeFileUrl,
      name: resumeAnalysis.resumeName,
      uploadError: resumeAnalysis.resumeUploadError,
      previewSource: resumeAnalysis.resumePreviewSource,
      previewError: resumeAnalysis.resumePreviewError,
      previewUrl: resumeAnalysis.resumeOpenPreviewUrl,
      numPages: resumeAnalysis.numPages,
      score: resumeAnalysis.resumeScore,
      interviewTypeLabel: resumeAnalysis.resolvedInterviewTypeLabel,
      suggestions: resumeAnalysis.resumeSuggestions,
      isPreviewOpen: resumeAnalysis.isResumeOpen,
      setIsPreviewOpen: resumeAnalysis.setIsResumeOpen,
      handlePreviewLoadSuccess: resumeAnalysis.handleResumePreviewLoadSuccess,
      handlePreviewLoadError: resumeAnalysis.handleResumePreviewLoadError,
      handleFileSelect: resumeAnalysis.handleResumeFileSelect,
    },
    camera: {
      isOpen: cameraState.isCameraOpen,
      isExpanded: cameraState.isCameraExpanded,
      isReady: cameraState.isCameraReady,
      attempt: cameraState.cameraAttempt,
      errorCopy: cameraState.cameraErrorCopy,
      handleCameraError: cameraState.handleCameraError,
      handleCameraReady: cameraState.handleCameraReady,
      handleRetry: cameraState.handleRetryCamera,
      handleToggleCamera: cameraState.handleToggleCamera,
      handleToggleExpanded: cameraState.handleToggleCameraExpanded,
    },
  };
}
