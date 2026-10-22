import { useAppSelector } from "@/store/hooks";
import { useMemo } from "react";

export default function HomeHero() {
  const { currentUser } = useAppSelector((state) => state.user);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return "凌晨好";
    if (hour < 12) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
  }, []);

  return (
    <div className="mb-2 flex w-full flex-col items-start gap-1.5 px-2">
      <p className="text-sm text-muted-foreground">
        {greeting}，{currentUser?.username || "用户"}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        聊点什么？
      </h1>
    </div>
  );
}
