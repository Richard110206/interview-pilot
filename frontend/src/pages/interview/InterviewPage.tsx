import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { ArrowUp, FileText, MessageSquare, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import service from "@/lib/request";
import type { CameraPreviewHandle } from "@/components/camera/CameraPreview";
import ChatList from "@/components/chat/ChatList";
import SmartComposer from "@/components/chat/SmartComposer";
import InterviewCameraOverlay from "@/components/interview/InterviewCameraOverlay";
import InterviewHeader from "@/components/interview/InterviewHeader";
import InterviewResumePreviewDialog from "@/components/interview/InterviewResumePreviewDialog";
import InterviewResumeReferenceCard from "@/components/interview/InterviewResumeReferenceCard";
import InterviewResumeUploadCard from "@/components/interview/InterviewResumeUploadCard";
import InterviewSketchpadSheet from "@/components/interview/sketchpad/InterviewSketchpadSheet";
import { useInterviewDemeanorPolling } from "@/hooks/interview/camera/useInterviewDemeanorPolling";
import { useInterviewPageController } from "@/hooks/interview/useInterviewPageController";
import InterviewExecutionPanel from "@/components/interview/InterviewExecutionPanel";
import "./interview-room.css";

export default function InterviewPage() {
  const cameraPreviewRef = useRef<CameraPreviewHandle | null>(null);
  const [isSketchpadOpen, setIsSketchpadOpen] = useState(false);
  const { chat, interview, resume, camera, project } =
    useInterviewPageController();
  const { data: capabilities } = useQuery({
    queryKey: ["interview-capabilities"],
    queryFn: () =>
      service.get<{
        provider: string;
        voiceSupported: boolean;
        demeanorSupported: boolean;
      }>("/xunzhi/v1/interview/capabilities"),
    staleTime: 30000,
  });
  const { setInput, isReady, isSubmitting, handleSend, input, messages } = chat;
  const visibleMessages = useMemo(
    () =>
      capabilities?.voiceSupported === true
        ? messages
        : messages.map((message) => ({ ...message, tts: undefined })),
    [messages, capabilities?.voiceSupported],
  );
  const { setIsPreviewOpen } = resume;
  const captureFrame = useCallback(
    async () => cameraPreviewRef.current?.captureFrame() ?? null,
    [],
  );
  const handleInsertNotes = useCallback(
    (notes: string) => {
      if (!notes.trim()) return;
      setInput((prev) => (prev.trim() ? `${prev.trim()}\n\n${notes}` : notes));
      setIsSketchpadOpen(false);
    },
    [setInput],
  );
  const handleOpenSketchpad = useCallback(
    () => startTransition(() => setIsSketchpadOpen(true)),
    [],
  );
  const handleOpenResume = useCallback(
    () => startTransition(() => setIsPreviewOpen(true)),
    [setIsPreviewOpen],
  );
  useInterviewDemeanorPolling({
    sessionId: interview.sessionId,
    enabled:
      capabilities?.demeanorSupported === true &&
      Boolean(interview.sessionId) &&
      isReady &&
      camera.isReady &&
      !interview.isFinished &&
      !interview.isEnding,
    captureFrame,
  });
  const stage = interview.isFinished ? 2 : isReady ? 1 : 0;
  const canSend = !interview.isFinished && !isSubmitting && !resume.isUploading;

  return (
    <div className="interview-workspace">
      <InterviewHeader
        isReady={isReady}
        currentQuestionNumber={interview.currentQuestionNumber}
        isCurrentQuestionFollowUp={interview.isCurrentQuestionFollowUp}
        currentFollowUpCount={interview.currentFollowUpCount}
        isInterviewFinished={interview.isFinished}
        totalInterviewScore={interview.totalScore}
        isCameraOpen={camera.isOpen}
        isEndingInterview={interview.isEnding}
        onToggleCamera={camera.handleToggleCamera}
        onOpenSketchpad={handleOpenSketchpad}
        onEndInterview={interview.handleEndInterview}
      />
      <div className="room-body">
        <section className="room-conversation" aria-label="面试问答">
          <ol className="room-stages" aria-label="面试进度">
            {["准备资料", "面试问答", "查看报告"].map((label, index) => (
              <li
                key={label}
                data-current={stage === index}
                data-complete={stage > index}
                aria-current={stage === index ? "step" : undefined}
              >
                <span>{stage > index ? <Check size={12} /> : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="room-conversation-content">
            {isReady || interview.isFinished || project.data ? (
              <ChatList
                messages={visibleMessages}
                className="h-full px-5 py-8 lg:px-10"
              />
            ) : (
              <div className="room-empty-state">
                <div className="room-empty-symbol" aria-hidden="true">
                  <MessageSquare size={30} strokeWidth={1.4} />
                </div>
                <h2>从你的简历或项目开始。</h2>
                <p>
                  上传 PDF 简历，或在下方直接发送公开 GitHub 仓库链接。
                  <br />
                  也可以一起说明负责的模块和希望练习的方向。
                </p>
                <button
                  type="button"
                  className="room-upload-shortcut"
                  disabled={resume.isUploading}
                  onClick={() => resume.fileInputRef.current?.click()}
                >
                  <FileText size={16} />
                  {resume.isUploading ? "正在处理简历…" : "选择简历"}
                </button>
                <div className="room-practice-note">
                  <span>回答小提示</span>
                  <p>
                    先说明背景，再讲你的做法，最后补充结果。
                    <br />
                    需要整理思路时，可以打开右上角的构思板。
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="room-composer-area">
            <div className="room-composer-heading">
              <span>{isReady ? "你的回答" : "告诉我你的项目"}</span>
              <span>
                {project.isBusy
                  ? "正在读取项目…"
                  : isSubmitting
                    ? "正在提交…"
                    : interview.isFinished
                      ? "本次面试已结束"
                      : "Enter 发送，Shift + Enter 换行"}
              </span>
            </div>
            <SmartComposer
              value={input}
              onChange={setInput}
              onSend={handleSend}
              placeholder={
                interview.isFinished
                  ? "本次面试已结束"
                  : isReady
                    ? "说说你的思路与做法，也可补充 GitHub 项目链接…"
                    : "粘贴公开 GitHub 仓库链接，可一起说明负责的模块…"
              }
              disabled={!canSend}
              showDefaultLeading={false}
              className="room-answer-input"
              showVoiceButton={capabilities?.voiceSupported === true}
              actions={
                <button
                  type="button"
                  className="room-send-button"
                  aria-label={isReady ? "发送回答" : "发送消息"}
                  disabled={!canSend || !input.trim()}
                  onClick={handleSend}
                >
                  <ArrowUp size={17} />
                </button>
              }
            />
            <p className="room-footer-note">
              {capabilities?.provider === "deepseek"
                ? "当前为文字面试，摄像头仅供预览。"
                : ""}
              面试反馈供练习参考，请结合实际经历判断。
            </p>
          </div>
        </section>
        <aside className="room-preparation" aria-label="面试准备">
          <InterviewExecutionPanel
            sessionId={interview.sessionId}
            finished={interview.isFinished}
            busy={resume.isUploading || isSubmitting}
          />
          <InterviewCameraOverlay
            ref={cameraPreviewRef}
            isCameraOpen={camera.isOpen}
            isCameraExpanded={camera.isExpanded}
            isCameraReady={camera.isReady}
            cameraAttempt={camera.attempt}
            cameraErrorCopy={camera.errorCopy}
            onCameraError={camera.handleCameraError}
            onCameraReady={camera.handleCameraReady}
            onRetryCamera={camera.handleRetry}
            onToggleCamera={camera.handleToggleCamera}
            onToggleExpanded={camera.handleToggleExpanded}
          />
          <InterviewResumeUploadCard
            fileInputRef={resume.fileInputRef}
            isResumeUploading={resume.isUploading || project.isBusy}
            showUploadButton={!isReady && !interview.isFinished}
            resumeUploadStage={resume.uploadStage}
            resumeLocalFile={resume.localFile}
            resumeFileUrl={resume.fileUrl}
            resumeName={resume.name}
            resumePreviewError={resume.previewError}
            resumeUploadError={resume.uploadError}
            interviewError={interview.error}
            onResumeFileSelect={resume.handleFileSelect}
            onOpenResume={handleOpenResume}
          />
          <section className="room-session-guide">
            <h3>项目与八股，穿插着练</h3>
            <p>
              从项目经历聊到技术原理，再回到场景应用。作答前可用构思板整理要点，摄像头按需开启。
            </p>
          </section>
        </aside>
      </div>
      <InterviewResumePreviewDialog
        open={resume.isPreviewOpen}
        onOpenChange={resume.setIsPreviewOpen}
        resumePreviewSource={resume.previewSource}
        resumePreviewError={resume.previewError}
        resumeOpenPreviewUrl={resume.previewUrl}
        numPages={resume.numPages}
        resumeScore={resume.score}
        resolvedInterviewTypeLabel={resume.interviewTypeLabel}
        resumeSuggestions={resume.suggestions}
        onLoadSuccess={resume.handlePreviewLoadSuccess}
        onLoadError={resume.handlePreviewLoadError}
      />
      <InterviewSketchpadSheet
        open={isSketchpadOpen}
        onOpenChange={setIsSketchpadOpen}
        sessionId={interview.sessionId}
        currentQuestionNumber={interview.currentQuestionNumber}
        currentQuestionContent={interview.currentQuestionContent}
        onInsertNotes={handleInsertNotes}
      />
      <InterviewResumeReferenceCard
        key={[
          interview.sessionId ?? "no-session",
          resume.name ?? "no-resume",
          resume.previewUrl ?? "no-preview-url",
        ].join(":")}
        open={isSketchpadOpen}
        resumeName={resume.name}
        resumePreviewSource={resume.previewSource}
        resumePreviewError={resume.previewError}
        resumeOpenPreviewUrl={resume.previewUrl}
        numPages={resume.numPages}
        onLoadSuccess={resume.handlePreviewLoadSuccess}
        onLoadError={resume.handlePreviewLoadError}
      />
    </div>
  );
}
