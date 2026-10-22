import { useCallback, useState } from "react";
import { type MediaError } from "@/lib/media";

export type CameraErrorCopy = {
  title: string;
  description: string;
} | null;

const getMediaErrorCopy = (error: MediaError | null): CameraErrorCopy => {
  if (!error) return null;
  switch (error.kind) {
    case "permission_denied":
      return {
        title: "摄像头访问被阻止",
        description:
          "点击地址栏旁的站点设置，将摄像头改为允许或重置权限，再点击重新尝试。若仍被阻止，请检查系统相机隐私设置。",
      };
    case "not_found":
      return {
        title: "未检测到摄像头",
        description: "连接摄像头后重试，或检查系统相机设置。",
      };
    case "not_readable":
      return {
        title: "摄像头暂时无法使用",
        description: "关闭正在使用摄像头的其他应用，然后重新尝试。",
      };
    case "overconstrained":
      return {
        title: "摄像头不支持当前画面设置",
        description: "请更换摄像头，或检查设备驱动后重试。",
      };
    case "not_supported":
      return {
        title: "当前环境不支持摄像头",
        description: "请使用支持摄像头的浏览器，并通过 HTTPS 或本机地址访问。",
      };
    default:
      return {
        title: "摄像头未能启动",
        description: "请重新尝试，或检查浏览器与设备设置。",
      };
  }
};

export function useInterviewCameraState() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [cameraError, setCameraError] = useState<MediaError | null>(null);

  const handleCameraError = useCallback((error: MediaError) => {
    setIsCameraReady(false);
    setCameraError(error);
  }, []);

  const handleCameraReady = useCallback(() => {
    setCameraError(null);
    setIsCameraReady(true);
  }, []);

  const handleRetryCamera = useCallback(() => {
    setCameraError(null);
    setIsCameraReady(false);
    setIsCameraOpen(true);
    setCameraAttempt((previous) => previous + 1);
  }, []);

  const handleToggleCamera = useCallback(() => {
    setCameraError(null);
    setIsCameraReady(false);
    setIsCameraExpanded(false);
    setIsCameraOpen((prev) => !prev);
  }, []);

  const handleToggleCameraExpanded = useCallback(() => {
    setIsCameraExpanded((prev) => !prev);
  }, []);

  return {
    isCameraOpen,
    isCameraExpanded,
    isCameraReady,
    cameraAttempt,
    cameraErrorCopy: getMediaErrorCopy(cameraError),
    handleCameraError,
    handleCameraReady,
    handleRetryCamera,
    handleToggleCamera,
    handleToggleCameraExpanded,
  };
}
