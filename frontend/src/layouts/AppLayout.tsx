import { Outlet, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { ROUTES } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith(ROUTES.auth);
  const isMarketingHome = location.pathname === ROUTES.home;
  const hideSidebar = isMarketingHome;

  // Force collapse on auth pages; otherwise respect manual toggle.
  const shouldCollapse = isAuthPage || isSidebarCollapsed;

  return (
    <div className="flex h-screen overflow-hidden bg-ground">
      {!isMobile && !hideSidebar && (
        <aside
          className={cn(
            "hidden md:block flex-shrink-0 relative transition-all",
            shouldCollapse ? "w-[72px]" : "w-60",
          )}
        >
          <Sidebar
            isCollapsed={shouldCollapse}
            onToggleCollapse={
              !isAuthPage
                ? () => setIsSidebarCollapsed((prev) => !prev)
                : undefined
            }
          />
        </aside>
      )}

      {!hideSidebar ? (
        <Sheet key={location.pathname}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              aria-label="打开导航"
              className="md:hidden absolute left-4 top-4 z-50 p-2"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : null}

      <main
        className={cn(
          "app-main relative min-w-0 flex-1 overflow-hidden bg-sheet",
          !isMarketingHome &&
            "m-3 ml-0 rounded-2xl border max-md:m-0 max-md:rounded-none max-md:pt-14",
        )}
      >
        <div key={location.pathname} className="page-transition h-full min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
