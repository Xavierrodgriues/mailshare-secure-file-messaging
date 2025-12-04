import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  FolderOpen, 
  Plus,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ComposeDialog } from '@/components/mail/ComposeDialog';

const navItems = [
  { path: '/', label: 'Inbox', icon: Inbox },
  { path: '/sent', label: 'Sent', icon: Send },
  { path: '/drafts', label: 'Drafts', icon: FileText },
  { path: '/trash', label: 'Trash', icon: Trash2 },
];

const fileItems = [
  { path: '/shared-files', label: 'Shared Files', icon: FolderOpen },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg">MailShare</span>
          )}
        </div>

        {/* Compose Button */}
        <div className="p-3">
          <Button
            variant="compose"
            className={cn("w-full", collapsed && "px-0")}
            onClick={() => setComposeOpen(true)}
          >
            <Plus className="h-5 w-5" />
            {!collapsed && <span>Compose</span>}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'sidebar-active' : 'sidebar'}
                  className={cn(collapsed && "justify-center px-0")}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </NavLink>
            );
          })}

          {/* Divider */}
          <div className="py-3">
            <div className="h-px bg-border" />
          </div>

          {/* Files Section */}
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Files
            </p>
          )}
          {fileItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'sidebar-active' : 'sidebar'}
                  className={cn(collapsed && "justify-center px-0")}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", collapsed && "px-0")}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}
