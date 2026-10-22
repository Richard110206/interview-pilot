import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SidebarSearchProps = {
  isCollapsed?: boolean;
};

export default function SidebarSearch({ isCollapsed }: SidebarSearchProps) {
  if (isCollapsed) return null;

  return (
    <div className="px-3 pb-3 pt-1">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索"
          aria-label="搜索"
          className="h-8 rounded-md pl-9"
        />
      </div>
    </div>
  );
}
