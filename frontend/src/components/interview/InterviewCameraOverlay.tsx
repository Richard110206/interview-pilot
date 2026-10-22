import { forwardRef } from "react";
import { Maximize2, Minimize2, Video, VideoOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CameraPreview, { type CameraPreviewHandle } from "@/components/camera/CameraPreview";
import type { MediaError } from "@/lib/media";
import { cn } from "@/lib/utils";

type InterviewCameraOverlayProps = {
  isCameraOpen: boolean;
  isCameraExpanded: boolean;
  isCameraReady: boolean;
  cameraAttempt: number;
  cameraErrorCopy: { title: string; description: string } | null;
  onCameraError: (error: MediaError) => void;
  onCameraReady: () => void;
  onRetryCamera: () => void;
  onToggleCamera: () => void;
  onToggleExpanded: () => void;
};

const InterviewCameraOverlay = forwardRef<CameraPreviewHandle, InterviewCameraOverlayProps>(
  function InterviewCameraOverlay({
    isCameraOpen, isCameraExpanded, isCameraReady, cameraAttempt,
    cameraErrorCopy, onCameraError, onCameraReady, onRetryCamera,
    onToggleCamera, onToggleExpanded,
  }, ref) {
    return (
      <section aria-label="摄像头预览" className={cn("room-camera", isCameraExpanded && "room-camera-expanded")}>
        <div className="room-section-heading">
          <h3>摄像头</h3>
          <span className="room-device-status"><i data-active={isCameraReady} />{isCameraReady ? "已开启" : "未开启"}</span>
        </div>
        <div className="room-camera-frame">
          <CameraPreview key={cameraAttempt} ref={ref} isOpen={isCameraOpen} onError={onCameraError} onReady={onCameraReady} />
          {(!isCameraReady || cameraErrorCopy) && (
            <div className="room-camera-placeholder" role={cameraErrorCopy ? "alert" : "status"}>
              <VideoOff size={28} strokeWidth={1.3} aria-hidden="true" />
              <strong>{cameraErrorCopy?.title ?? (isCameraOpen ? "等待摄像头授权" : "摄像头尚未开启")}</strong>
              <p>{cameraErrorCopy?.description ?? (isCameraOpen ? "请在浏览器弹窗中选择允许。" : "点击下方按钮，确认是否允许访问。")}</p>
              <Button size="sm" onClick={onRetryCamera} className="room-camera-activate">
                {cameraErrorCopy ? <RotateCw size={14} /> : <Video size={14} />}
                {cameraErrorCopy ? "重新尝试" : isCameraOpen ? "再次请求" : "开启摄像头"}
              </Button>
            </div>
          )}
          {isCameraReady && (
            <Button variant="secondary" size="icon" className="room-camera-expand" onClick={onToggleExpanded} aria-label={isCameraExpanded ? "缩小预览" : "放大预览"}>
              {isCameraExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          )}
        </div>
        <div className="room-camera-caption">
          <span>{isCameraReady ? "摄像头预览已开启" : "关闭摄像头也可以文字作答"}</span>
          {isCameraOpen && <button type="button" onClick={onToggleCamera}>关闭</button>}
        </div>
      </section>
    );
  },
);
export default InterviewCameraOverlay;
