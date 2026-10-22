import { Card } from "@/components/ui/card";

type InterviewIntroStepsCardProps = {
  title: string;
  steps: string[];
  updateTitle: string;
  updateDescription: string;
};

export default function InterviewIntroStepsCard({
  title,
  steps,
  updateTitle,
  updateDescription,
}: InterviewIntroStepsCardProps) {
  return (
    <Card className="intro-steps-card overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ol className="mt-5 space-y-5">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 text-sm leading-relaxed"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="pt-0.5 text-foreground/85">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="border-t bg-secondary/50 p-6">
        <h3 className="text-sm font-semibold text-primary">{updateTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {updateDescription}
        </p>
        <div className="mt-5 space-y-4 border-l-2 border-primary/20 pl-4">
          <p className="text-xs text-muted-foreground">
            练习对话示例 · Redis 缓存
          </p>
          <div>
            <span className="text-xs text-primary">项目经历</span>
            <p className="mt-1 text-sm leading-relaxed">
              你的项目为什么需要缓存？
            </p>
          </div>
          <div>
            <span className="text-xs text-primary">八股原理</span>
            <p className="mt-1 text-sm leading-relaxed">
              缓存和数据库怎样保持一致？
            </p>
          </div>
          <div>
            <span className="text-xs text-primary">场景应用</span>
            <p className="mt-1 text-sm leading-relaxed">
              热点缓存失效，怎样避免请求压垮数据库？
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
