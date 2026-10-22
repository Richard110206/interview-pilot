import { Link, useLocation } from "react-router-dom";
import {
  BookMarked,
  LibraryBig,
  MessageSquare,
  Video,
  NotebookPen,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  isCollapsed?: boolean;
};

const NAV_ITEMS = [
  {
    path: ROUTES.learning,
    icon: NotebookPen,
    label: "我的练习",
    group: "复盘提升",
    detail: "错题、收藏与成长记录",
  },
  {
    path: ROUTES.interviewIntro,
    icon: Video,
    label: "AI 面试",
    group: "面试练习",
    detail: "围绕简历，练习表达",
  },
  {
    path: ROUTES.chat,
    icon: MessageSquare,
    label: "新对话",
    group: "面试练习",
    detail: "梳理原理与项目思路",
  },
  {
    path: ROUTES.questionBank,
    icon: LibraryBig,
    label: "题库",
    group: "准备资料",
    detail: "按岗位找到练习方向",
  },
  {
    path: ROUTES.knowledge,
    icon: BookMarked,
    label: "知识库",
    group: "准备资料",
    detail: "在资料中找到依据",
  },
];

export default function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const location = useLocation();
  const isActive = (path: string) =>
    path === ROUTES.chat
      ? location.pathname === ROUTES.chat ||
        location.pathname.startsWith(`${ROUTES.chat}/`)
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <nav className="workspace-nav px-3" aria-label="主导航">
      <ul>
        {NAV_ITEMS.map(({ path, icon: Icon, label, group, detail }, index) => {
          const active = isActive(path);
          return (
            <li key={path}>
              {!isCollapsed &&
                (index === 0 || NAV_ITEMS[index - 1].group !== group) && (
                  <p className="workspace-nav-label">{group}</p>
                )}
              <Link
                to={path}
                aria-label={label}
                title={isCollapsed ? label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "workspace-nav-item flex items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
                  active
                    ? "bg-secondary font-medium text-foreground"
                    : "text-foreground/85 hover:bg-accent hover:text-foreground",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                  strokeWidth={1.5}
                />
                {!isCollapsed && (
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
