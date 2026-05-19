import { Menu, Search, Bell, LogOut } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export function TopNav() {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5 focus-ring"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-md rounded-lg border border-border bg-surface-elevated/50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="search"
              placeholder="Search feedback, customers..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none min-w-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative p-2 rounded-lg text-slate-400 hover:bg-white/5 focus-ring"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-cyan" />
          </button>
          <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-200">{user?.name ?? 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role ?? 'analyst'}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-indigo/30 flex items-center justify-center text-sm font-medium text-slate-200">
              {(user?.name ?? 'U')[0].toUpperCase()}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
