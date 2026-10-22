import { cn } from "@/lib/utils";

/** Decorative ImageGen artwork; text and controls remain independent of it. */
export default function StudyArtwork({ className }: { className?: string }) {
  return (
    <img
      className={cn("study-artwork", className)}
      src="/brand/conversation-still-life-560.webp"
      srcSet="/brand/conversation-still-life-560.webp 560w, /brand/conversation-still-life-1120.webp 1120w"
      sizes="(max-width: 767px) 160px, 240px"
      width={560}
      height={373}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  );
}
