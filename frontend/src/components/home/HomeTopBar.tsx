import { Button } from "@/components/ui/button";

export default function HomeTopBar() {
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="ghost" className="h-8 px-3 text-muted-foreground">
        私密模式
      </Button>
      <Button variant="ghost" className="h-8 px-3 text-muted-foreground">
        分享
      </Button>
    </div>
  );
}
