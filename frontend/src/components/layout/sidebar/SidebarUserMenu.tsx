import { LogOut, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type SidebarUserMenuProps = {
  isCollapsed?: boolean;
  avatar?: string | null;
  username?: string | null;
  mail?: string | null;
  phone?: string | null;
  userInitials: string;
  onLogout: () => void;
};

export default function SidebarUserMenu({
  isCollapsed,
  avatar,
  username,
  mail,
  phone,
  userInitials,
  onLogout,
}: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center rounded-md p-2 outline-none transition-colors hover:bg-accent",
            isCollapsed ? "justify-center" : "gap-3",
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed ? (
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-sm font-medium text-foreground">
                {username || "用户"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {mail || phone || "已登录"}
              </p>
            </div>
          ) : null}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-60 p-2 mb-2"
        side={isCollapsed ? "right" : "top"}
        align={isCollapsed ? "end" : "center"}
        sideOffset={isCollapsed ? 20 : 10}
      >
        <div className="flex flex-col gap-1">
          <div className="mb-1 flex items-center gap-3 rounded-md bg-muted p-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="bg-secondary font-medium text-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {username || "用户"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {mail || phone}
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="ghost"
            className="h-8 w-full justify-start px-2 text-sm font-normal"
          >
            <Link to={ROUTES.account} onClick={() => setOpen(false)}>
              <User className="mr-2 h-4 w-4" />
              管理账号
            </Link>
          </Button>

          <div className="my-1 h-px bg-border" />

          <Button
            variant="ghost"
            className="h-8 w-full justify-start px-2 text-sm font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
