import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Sparkles,
  Bell,
  Settings,
  ChevronLeft,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUiStore } from '@/store/uiStore';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/feedback', icon: MessageSquare, label: 'Feedback Explorer' },
  { to: '/customers', icon: Users, label: 'Customer 360' },
  { to: '/insights', icon: Sparkles, label: 'AI Insights' },
  { to: '/alerts', icon: Bell, label: 'Alerts & Trends' },
];

const adminNav = [{ to: '/admin', icon: Settings, label: 'Admin Panel' }];

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  onClick,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
          isActive
            ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } =
    useUiStore();

  const content = (
  <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent-cyan shrink-0" />
          {!sidebarCollapsed && (
            <span className="font-semibold tracking-tight text-slate-100">
              Feedback<span className="text-accent-cyan">IQ</span>
            </span>
          )}
        </NavLink>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          className="lg:hidden p-1 text-slate-500 hover:text-slate-300"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p
          className={cn(
            'px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600',
            sidebarCollapsed && 'sr-only'
          )}
        >
          Intelligence
        </p>
        {mainNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={sidebarCollapsed}
            onClick={() => setMobileSidebarOpen(false)}
          />
        ))}
        <p
          className={cn(
            'px-3 py-2 mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600',
            sidebarCollapsed && 'sr-only'
          )}
        >
          Settings
        </p>
        {adminNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={sidebarCollapsed}
            onClick={() => setMobileSidebarOpen(false)}
          />
        ))}
      </nav>
      <div className="p-3 border-t border-border hidden lg:block">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 text-sm"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 h-screen flex flex-col glass-strong border-r border-border transition-all duration-300',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {content}
      </aside>
    </>
  );
}
