import { Check, FileText, Loader2, Upload } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import ErrorNotice from "@/components/feedback/ErrorNotice";
import { Button } from "@/components/ui/button";
import { INTERVIEW_DEFAULTS } from "@/lib/constants";

const STAGES = ["上传简历", "解析内容", "生成问题"];
type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isResumeUploading: boolean;
  showUploadButton: boolean;
  resumeUploadStage: number;
  resumeLocalFile: File | null;
  resumeFileUrl: string | null;
  resumeName: string | null;
  resumePreviewError: string | null;
  resumeUploadError: string | null;
  interviewError: string | null;
  onResumeFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenResume: () => void;
};
export default function InterviewResumeUploadCard({fileInputRef, isResumeUploading, showUploadButton,
  resumeUploadStage, resumeLocalFile, resumeFileUrl, resumeName, resumePreviewError,
  resumeUploadError, interviewError, onResumeFileSelect, onOpenResume}: Props) {
  const hasResume = Boolean(resumeLocalFile || resumeFileUrl || resumeName || resumePreviewError);
  const stage = Math.min(Math.max(resumeUploadStage, 0), STAGES.length - 1);
  return <section className="room-resume-section">
    <div className="room-section-heading"><h3>面试简历</h3><span>PDF</span></div>
    <div className="room-resume-file"><FileText size={25} strokeWidth={1.4} aria-hidden="true" /><div>
      <strong title={resumeName ?? undefined}>{resumeName || "还没有添加简历"}</strong>
      <p>{hasResume ? "用于生成本次面试的问题" : "选择与你求职方向相关的简历"}</p>
    </div></div>
    <input ref={fileInputRef} type="file" accept={INTERVIEW_DEFAULTS.resumeAccept} className="hidden" onChange={onResumeFileSelect} aria-label="选择 PDF 简历" />
    <div className="room-resume-actions">
      {showUploadButton && <Button variant="outline" disabled={isResumeUploading} onClick={() => fileInputRef.current?.click()}>
        {isResumeUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {isResumeUploading ? "正在处理…" : hasResume ? "重新上传" : "上传简历"}
      </Button>}
      {hasResume && <Button variant="ghost" onClick={onOpenResume}>查看简历</Button>}
    </div>
    {isResumeUploading && <ol className="room-upload-progress" aria-label="简历处理进度">{STAGES.map((label,index) => <li key={label} data-current={index === stage} aria-current={index === stage ? "step" : undefined}>
      {index < stage ? <Check size={14} /> : index === stage ? <Loader2 size={14} className="animate-spin" /> : <span className="room-upload-wait" />}{label}
    </li>)}</ol>}
    {resumeUploadError && <ErrorNotice title="简历上传失败" description={resumeUploadError} />}
    {interviewError && <ErrorNotice title="面试暂时无法继续" description={interviewError} />}
  </section>;
}
