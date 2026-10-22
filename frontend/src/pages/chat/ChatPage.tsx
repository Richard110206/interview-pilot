import ChatHistoryLoadingOverlay from "@/components/chat/ChatHistoryLoadingOverlay";
import ChatPageHeader from "@/components/chat/ChatPageHeader";
import ChatRoom from "@/components/chat/ChatRoom";
import SmartComposer from "@/components/chat/SmartComposer";
import { ModelSelector } from "@/components/home/ModelSelector";
import { useChatPageController } from "@/hooks/chat/useChatPageController";

export default function ChatPage() {
  const { history, composer, modelSelection } = useChatPageController();

  return (
    <ChatRoom
      header={
        <ChatPageHeader
          selectedModelName={modelSelection.selectedModel?.aiName}
        />
      }
      topContent={
        history.messages.length === 0 && !history.isLoading ? (
          <section className="discussion-welcome mx-auto max-w-3xl py-8 md:py-12">
            <p className="text-sm text-primary">面试前的技术讨论</p>
            <h1 className="display-heading mt-3 text-3xl font-semibold tracking-tight">
              先把一个知识点，讲清楚。
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              讨论技术原理、梳理项目表达，或从一道场景题开始。点击下面的话题，编辑后发送。
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "讲清技术原理",
                  prompt:
                    "帮我梳理 HashMap 的 put 流程，并指出面试时值得展开的细节。",
                },
                {
                  title: "组织项目表达",
                  prompt:
                    "我想练习介绍自己的项目。请先问我项目背景和负责内容，再帮我组织表达。",
                },
                {
                  title: "拆解场景问题",
                  prompt:
                    "如果热点缓存突然失效，怎样保护数据库？请引导我分析方案和取舍。",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.title}
                  className="rounded-xl border bg-secondary/40 p-5 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={() => composer.setInput(item.prompt)}
                >
                  <h2 className="text-sm font-semibold text-primary">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : undefined
      }
      messages={history.messages}
      inputValue={composer.input}
      onInputChange={composer.setInput}
      onSend={composer.handleSend}
      contentOverlay={history.isLoading ? <ChatHistoryLoadingOverlay /> : null}
      customComposer={
        <SmartComposer
          value={composer.input}
          onChange={composer.setInput}
          onSend={composer.handleSend}
          disabled={composer.isBlocked}
          actions={
            modelSelection.models.length > 0 &&
            modelSelection.selectedModel && (
              <ModelSelector
                models={modelSelection.models}
                selectedModel={modelSelection.selectedModel}
                onSelect={modelSelection.setSelectedModel}
              />
            )
          }
        />
      }
    />
  );
}
