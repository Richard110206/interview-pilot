import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SidebarGuestEntryProps = {
  isCollapsed?: boolean;
};

export default function SidebarGuestEntry({
  isCollapsed,
}: SidebarGuestEntryProps) {
  return (
    <Link to={ROUTES.auth} className="block">
      <div
        className={cn(
          "flex items-center rounded-md p-2 transition-colors hover:bg-accent",
          isCollapsed ? "justify-center" : "gap-3",
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          ME
        </div>
        {!isCollapsed ? (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-foreground">登录 / 注册</p>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
