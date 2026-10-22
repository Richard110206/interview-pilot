import { useState } from "react";
import { Brain, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type ChatReasoningPanelProps = {
  reasoning: string;
  isStreaming: boolean;
  hasContent: boolean;
};

export default function ChatReasoningPanel({
  reasoning,
  isStreaming,
  hasContent,
}: ChatReasoningPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex items-center w-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent"
      >
        <Brain className="w-3.5 h-3.5 mr-2" />
        <span className="font-medium">深度思考</span>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-auto"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-border/60 px-3 pb-3 pt-0 text-sm italic whitespace-pre-wrap text-muted-foreground">
              <div className="pt-2">
                {reasoning}
                {isStreaming && !hasContent ? (
                  <span className="inline-block w-1.5 h-3 bg-muted-foreground ml-1 animate-pulse align-middle" />
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
