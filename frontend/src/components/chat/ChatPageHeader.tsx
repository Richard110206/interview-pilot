import { APP_BRAND_NAME } from "@/lib/branding";

type ChatPageHeaderProps = {
  selectedModelName?: string;
};

export default function ChatPageHeader({
  selectedModelName,
}: ChatPageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-sheet px-6 py-3.5">
      <div className="flex items-center gap-2.5">
        <img
          src="/brand/yingda-mark-256.png"
          alt={APP_BRAND_NAME}
          className="h-6 w-6 rounded-sm object-cover"
        />
        <h2 className="text-sm font-semibold">{APP_BRAND_NAME}</h2>
        {selectedModelName ? (
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {selectedModelName}
          </span>
        ) : null}
      </div>
    </div>
  );
}
