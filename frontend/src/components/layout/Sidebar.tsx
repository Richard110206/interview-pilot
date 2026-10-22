import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import SidebarHeader from "@/components/layout/sidebar/SidebarHeader";
import SidebarSearch from "@/components/layout/sidebar/SidebarSearch";
import SidebarNav from "@/components/layout/sidebar/SidebarNav";
import SidebarHistory from "@/components/layout/sidebar/SidebarHistory";
import SidebarFooter from "@/components/layout/sidebar/SidebarFooter";

export type SidebarProps = HTMLAttributes<HTMLDivElement> & {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function Sidebar({
  className,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <div
      className={cn("app-sidebar flex h-full flex-col bg-ground", className)}
    >
      <SidebarHeader
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <SidebarSearch isCollapsed={isCollapsed} />
      <SidebarNav isCollapsed={isCollapsed} />
      <SidebarHistory isCollapsed={isCollapsed} />
      <div className="mt-auto">
        <SidebarFooter isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
