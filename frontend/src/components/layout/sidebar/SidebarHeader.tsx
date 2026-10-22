import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_BRAND_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type SidebarHeaderProps = {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
}: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center px-4 py-4",
        isCollapsed ? "justify-center" : "justify-between",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5",
          isCollapsed && "w-full justify-center",
        )}
      >
        <img
          src="/brand/yingda-mark-256.png"
          alt={APP_BRAND_NAME}
          className="h-6 w-6 rounded-sm object-cover"
        />
        {!isCollapsed && (
          <span className="text-sm font-semibold text-foreground">
            {APP_BRAND_NAME}
          </span>
        )}
      </div>
      {onToggleCollapse && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 text-muted-foreground",
            isCollapsed && "absolute right-2 top-4",
          )}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "展开侧栏" : "收起侧栏"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
