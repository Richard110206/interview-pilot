import { NotebookPen, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

type InterviewHeaderProps = {
  isReady: boolean;
  currentQuestionNumber: string | null;
  isCurrentQuestionFollowUp: boolean;
  currentFollowUpCount: number;
  isInterviewFinished: boolean;
  totalInterviewScore: number | null;
  isCameraOpen: boolean;
  isEndingInterview: boolean;
  onToggleCamera: () => void;
  onOpenSketchpad: () => void;
  onEndInterview: () => void;
};

export default function InterviewHeader({
  isReady, currentQuestionNumber, isCurrentQuestionFollowUp, currentFollowUpCount,
  isInterviewFinished, totalInterviewScore, isCameraOpen, isEndingInterview,
  onToggleCamera, onOpenSketchpad, onEndInterview,
}: InterviewHeaderProps) {
  return (
    <header className="room-header">
      <div className="room-title-group">
        <span className="room-breadcrumb">面试练习 / 面试室</span>
        <div className="room-title-line">
          <h1>模拟面试</h1>
          <span className="room-session-status">{isInterviewFinished ? "已结束" : isReady ? "进行中" : "准备中"}</span>
        </div>
        {(currentQuestionNumber || totalInterviewScore !== null) && <p className="room-progress-summary">
          {currentQuestionNumber && !isInterviewFinished && `第 ${currentQuestionNumber} 题`}
          {isCurrentQuestionFollowUp && !isInterviewFinished && `，第 ${currentFollowUpCount} 次追问`}
          {totalInterviewScore !== null && ` 总分 ${totalInterviewScore}`}
        </p>}
      </div>
      <div className="room-header-actions">
        <Button variant="ghost" size="sm" onClick={onToggleCamera}>
          {isCameraOpen ? <Video size={16} /> : <VideoOff size={16} />}
          <span>{isCameraOpen ? "关闭摄像头" : "开启摄像头"}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenSketchpad}>
          <NotebookPen size={16} />构思板
        </Button>
        <Button variant="outline" size="sm" className="room-end-button" disabled={!isReady || isEndingInterview} onClick={onEndInterview}>
          {isEndingInterview ? "正在结束…" : "结束面试"}
        </Button>
      </div>
    </header>
  );
}
