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

export function SidebarContent({
  collapsed,
  onCollapse,
  isMobile = false,
  onCloseMobile
}: {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}) {
  const location = useLocation();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn("flex items-center gap-3 p-4 border-b border-border", collapsed && !isMobile && "justify-center")}>
          <img
            src="/footer-logo.png"
            alt="MailShare"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed && !isMobile ? "h-8 w-8" : "h-8 w-auto"
            )}
          />
        </div>

        {/* Compose Button */}
        <div className="p-3">
          <Button
            variant="compose"
            className={cn("w-full", collapsed && !isMobile && "px-0")}
            onClick={() => {
              setComposeOpen(true);
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
          >
            <Plus className="h-5 w-5" />
            {(!collapsed || isMobile) && <span>Compose</span>}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} onClick={() => isMobile && onCloseMobile?.()}>
                <Button
                  variant={isActive ? 'sidebar-active' : 'sidebar'}
                  className={cn(collapsed && !isMobile && "justify-center px-0")}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </Button>
              </NavLink>
            );
          })}

          {/* Divider */}
          <div className="py-3">
            <div className="h-px bg-border" />
          </div>

          {/* Files Section */}
          {(!collapsed || isMobile) && (
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Files
            </p>
          )}
          {fileItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} onClick={() => isMobile && onCloseMobile?.()}>
                <Button
                  variant={isActive ? 'sidebar-active' : 'sidebar'}
                  className={cn(collapsed && !isMobile && "justify-center px-0")}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </Button>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle (Desktop only) */}
        {!isMobile && onCollapse && (
          <div className="p-3 border-t border-border mt-auto">
            <Button
              variant="ghost"
              size="sm"
              className={cn("w-full", collapsed && "px-0")}
              onClick={() => onCollapse(!collapsed)}
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
        )}
      </div>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <SidebarContent collapsed={collapsed} onCollapse={setCollapsed} />
    </aside>
  );
}
