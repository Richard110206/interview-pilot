import type { IntroHighlight } from "@/components/interview/intro/introCopy";

type InterviewIntroHighlightsProps = {
  highlights: IntroHighlight[];
};

export default function InterviewIntroHighlights({
  highlights,
}: InterviewIntroHighlightsProps) {
  return (
    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {highlights.map((highlight) => (
        <div key={highlight.title} className="border-t border-primary/15 pt-4">
          <p className="text-sm font-semibold text-primary">
            {highlight.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {highlight.description}
          </p>
        </div>
      ))}
    </div>
  );
}
