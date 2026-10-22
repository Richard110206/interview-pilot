import { APP_BRAND_NAME, APP_MARKETING_TAGLINE } from "@/lib/branding";

const highlights = [
  "按简历出题、追问、评分的完整面试流程",
  "多岗位题库与知识库双源检索，题目可溯源",
  "面试报告沉淀历史，跨场次复盘提升",
];

export default function AuthMarketingPanel() {
  return (
    <div className="space-y-5">
      <img
        src="/brand/careers.webp"
        width="1536"
        height="1024"
        className="max-h-60 w-full rounded-2xl object-cover"
        alt="映答多岗位面试练习空间插图"
      />
      <p className="text-sm text-muted-foreground">
        {APP_BRAND_NAME} · {APP_MARKETING_TAGLINE}
      </p>
      <div className="space-y-3">
        <h1 className="display-heading text-4xl font-semibold leading-tight tracking-tight">
          登录后开启
          <br />
          AI 模拟面试
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          上传简历即可体验检索增强出题、逐题评分与可复盘的面试报告。
        </p>
      </div>
      <ul className="space-y-2.5">
        {highlights.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-sm leading-relaxed text-foreground/85"
          >
            <span aria-hidden="true" className="text-primary">
              —
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
