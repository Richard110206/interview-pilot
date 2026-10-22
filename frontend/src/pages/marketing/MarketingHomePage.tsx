import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  MessageSquare,
  Pause,
  Play,
} from "lucide-react";
import { APP_BRAND_NAME } from "@/lib/branding";
import StudyArtwork from "@/components/brand/StudyArtwork";
import { ROUTES } from "@/lib/constants";
import { useAppSelector } from "@/store/hooks";
import {
  MARKETING_PROJECT_DEMO_VIDEO_SRC,
  MARKETING_TEXT,
} from "./marketingHome.constants";
import "./marketing-home.css";

const conversations = [
  {
    label: "项目经历",
    question: "你在项目里，为什么选择 Redis 做缓存？",
    detail: "从简历中的技术选型聊起",
    tag: "简历驱动",
    answer: "我负责热点数据查询，用缓存减少数据库的重复读取……",
  },
  {
    label: "八股原理",
    question: "沿着这个场景，缓存与数据库如何保持一致？",
    detail: "把项目里用过的技术问深一层",
    tag: "题库检索",
    answer: "我会先分析更新顺序，再考虑并发读写与失效重试……",
  },
  {
    label: "场景应用",
    question: "如果热点缓存突然失效，你会怎样保护数据库？",
    detail: "从知道原理，到解释实际做法",
    tag: "场景追问",
    answer: "可以用互斥重建，并为不同热点设置合适的过期策略……",
  },
];

export default function MarketingHomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = conversations[active];
  const handleStartNow = useCallback(() => {
    if (isAuthenticated) navigate(ROUTES.interviewIntro);
    else
      navigate(ROUTES.auth, {
        state: { from: { pathname: ROUTES.interviewIntro } },
      });
  }, [isAuthenticated, navigate]);

  return (
    <div className="studio-home h-full overflow-y-auto">
      <header className="studio-nav">
        <a href={ROUTES.home} className="studio-brand">
          <img src="/brand/yingda-mark-256.png" alt="" />
          {APP_BRAND_NAME}
          <span>面试练习空间</span>
        </a>
        <nav aria-label="首页导航">
          <a href="#practice">练习方式</a>
          <a href="#demo">系统演示</a>
          <button type="button" onClick={handleStartNow}>
            {MARKETING_TEXT.startNow}
            <ArrowUpRight size={16} />
          </button>
        </nav>
      </header>
      <main>
        <section className="studio-hero">
          <div className="studio-hero-copy">
            <h1>
              把做过的项目，
              <br />
              讲成你的实力。
            </h1>
            <p className="studio-description">
              从你的简历出发，把项目深挖、八股原理和场景追问串成一场面试。练的不只是答案，还有把技术讲清楚的能力。
            </p>
            <div className="studio-actions">
              <button
                className="studio-primary"
                type="button"
                onClick={handleStartNow}
              >
                {MARKETING_TEXT.startNow}
                <ArrowRight size={18} />
              </button>
              <button
                className="studio-secondary"
                type="button"
                onClick={() => navigate(ROUTES.questionBank)}
              >
                {MARKETING_TEXT.secondaryAction}
                <ArrowUpRight size={17} />
              </button>
            </div>
            <p className="studio-hero-note">
              <Check size={15} />
              上传简历开始练习 <span />
              文字作答，按自己的节奏来
            </p>
            <div className="studio-skills">
              <span>在一场面试里练</span>
              <b>后端</b>
              <b>前端</b>
              <b>测试</b>
              <b>算法</b>
            </div>
          </div>
          <div className="rehearsal-wrap">
            <div
              className="rehearsal-sheet"
              data-ui="interview-preview"
              data-paused={paused}
            >
              <div className="rehearsal-top">
                <div>
                  <span className="rehearsal-dot" />
                  面试对话预览
                </div>
                <span>示意内容</span>
              </div>
              <div className="rehearsal-context">
                <FileText size={19} />
                <div>
                  <strong>你的项目，是问题的起点</strong>
                  <p>项目经历 · 技术原理 · 场景应用</p>
                </div>
              </div>
              <div
                className="rehearsal-tabs"
                role="tablist"
                aria-label="切换面试环节"
              >
                {conversations.map((item, index) => (
                  <button
                    key={item.label}
                    id={`preview-tab-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={index === active}
                    aria-controls="preview-panel"
                    tabIndex={index === active ? 0 : -1}
                    onClick={() => setActive(index)}
                    onKeyDown={(e) => {
                      if (
                        ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          e.key,
                        )
                      ) {
                        e.preventDefault();
                        const next =
                          e.key === "Home"
                            ? 0
                            : e.key === "End"
                              ? 2
                              : (active + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                        setActive(next);
                        document.getElementById(`preview-tab-${next}`)?.focus();
                      }
                    }}
                  >
                    <span>{index + 1}</span>
                    {item.label}
                  </button>
                ))}
              </div>
              <div
                id="preview-panel"
                role="tabpanel"
                aria-labelledby={`preview-tab-${active}`}
                className="rehearsal-dialogue"
                key={active}
              >
                <div className="rehearsal-person">
                  <div className="rehearsal-avatar">
                    <MessageSquare size={17} />
                  </div>
                  <strong>面试官</strong>
                  <span>{current.tag}</span>
                </div>
                <h2>{current.question}</h2>
                <p className="rehearsal-detail">{current.detail}</p>
                <div className="rehearsal-answer">
                  <span>你</span>
                  <p>{current.answer}</p>
                </div>
                <div className="rehearsal-wave" aria-hidden="true">
                  {Array.from({ length: 32 }, (_, i) => (
                    <i
                      key={i}
                      style={{
                        height: `${8 + ((i * 17 + 7) % 29)}px`,
                        animationDelay: `${i * 35}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="rehearsal-bottom">
                <span>
                  <Check size={14} />
                  项目与原理，连起来练
                </span>
                <button
                  type="button"
                  onClick={() => setPaused(!paused)}
                  aria-label={paused ? "播放预览动画" : "暂停预览动画"}
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              </div>
            </div>
            <div className="rehearsal-caption">
              <span>一场练习，三个观察角度</span>
              <span>点击上方环节体验</span>
            </div>
          </div>
        </section>
        <section className="studio-practice" id="practice">
          <div className="studio-section-title">
            <h2>知识点，放回真实对话里。</h2>
            <p>从“我做过”，走到“我理解”，再到“我能解决”。</p>
          </div>
          <div className="practice-route">
            {conversations.map((item, i) => (
              <button
                type="button"
                key={item.label}
                onClick={() => {
                  setActive(i);
                  document.getElementById(`preview-tab-${i}`)?.focus();
                }}
              >
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.detail}</p>
                </div>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
        </section>
        <section className="studio-careers">
          <div className="studio-careers-copy">
            <h2>
              不同的方向，
              <br />
              都值得认真准备。
            </h2>
            <p>
              从前后端开发，到测试与算法。围绕你的简历，把岗位知识与实际经历接起来。
            </p>
            <div className="career-labels">
              <span>Java / Go</span>
              <span>C++</span>
              <span>前端开发</span>
              <span>测试开发</span>
              <span>算法与 NLP</span>
            </div>
            <button
              type="button"
              className="studio-secondary"
              onClick={() => navigate(ROUTES.questionBank)}
            >
              找到你的练习方向
              <ArrowUpRight size={17} />
            </button>
          </div>
          <img
            src="/brand/careers.webp"
            width="1536"
            height="1024"
            loading="lazy"
            alt="开发、测试与算法岗位的学习者在同一练习空间讨论项目与技术"
          />
        </section>
        <section className="studio-demo" id="demo">
          <div className="studio-demo-copy">
            <h2>
              练习过程，
              <br />
              看得见。
            </h2>
            <p>
              浏览真题、检索知识、进入面试，再回到报告查看回答与反馈。这里是系统的实际操作录屏。
            </p>
            <button
              type="button"
              className="studio-secondary"
              onClick={() => navigate(ROUTES.knowledge)}
            >
              浏览知识库
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="studio-video">
            <video
              controls
              preload="none"
              poster="/videos/yingda-demo-poster.jpg"
              aria-label="系统实际操作演示"
            >
              <source src={MARKETING_PROJECT_DEMO_VIDEO_SRC} type="video/mp4" />
            </video>
            <p>映答使用演示 · 约 1 分钟 · 含操作字幕与示范作答</p>
          </div>
        </section>
        <section className="studio-closing">
          <StudyArtwork />
          <div>
            <h2>下一次开口，更有底气。</h2>
            <p>带上你的简历，从第一个项目问题开始。</p>
          </div>
          <button
            type="button"
            onClick={handleStartNow}
            className="studio-primary"
          >
            {MARKETING_TEXT.startNow}
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer className="studio-footer">
        <span>{APP_BRAND_NAME} · 简历分析与模拟面试</span>
        <span>准备充分，表达从容。</span>
      </footer>
    </div>
  );
}
