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
  ChevronRight,
  Settings,
  Bell
} from 'lucide-react';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useBroadcasts } from '@/hooks/useBroadcasts';


const navItems = [
  { path: '/', label: 'Inbox', icon: Inbox },
  { path: '/sent', label: 'Sent', icon: Send },
  { path: '/drafts', label: 'Drafts', icon: FileText },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  // { path: '/trash', label: 'Trash', icon: Trash2 },
];

const fileItems = [
  { path: '/shared-files', label: 'Shared Files', icon: FolderOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarContent({
  collapsed,
  onCollapse,
  isMobile = false,
  onCloseMobile,
  onComposeClick
}: {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
  onComposeClick?: () => void;
}) {
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { broadcasts } = useBroadcasts();
  const notificationCount = broadcasts.length;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn("flex items-center gap-3 p-4 border-b border-border", collapsed && !isMobile && "justify-center")}>
          <img
            src="/yuvii-logo.png"
            style={{ width: "180px", height: "100px" }}
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
              if (onComposeClick) onComposeClick();
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
            const isInbox = item.label === 'Inbox';
            const isNotifications = item.label === 'Notifications';
            const showInboxBadge = isInbox && unreadCount > 0;
            const showNotificationBadge = isNotifications && notificationCount > 0;

            // Determine which count to show
            let countToShow = 0;
            let showBadge = false;

            if (showInboxBadge) {
              countToShow = unreadCount;
              showBadge = true;
            } else if (showNotificationBadge) {
              countToShow = notificationCount;
              showBadge = true;
            }

            return (
              <NavLink key={item.path} to={item.path} onClick={() => isMobile && onCloseMobile?.()}>
                <Button
                  variant={isActive ? 'sidebar-active' : 'sidebar'}
                  className={cn(
                    "relative", // Added for positioning context if needed, though flex works
                    collapsed && !isMobile && "justify-center px-0"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && (
                    <div className="flex flex-1 items-center justify-between w-full">
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-primary rounded-full">
                          {countToShow > 99 ? '99+' : countToShow}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Show a small dot when collapsed if unread items exist */}
                  {(collapsed && !isMobile && showBadge) && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                  )}
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
    </>
  );
}

export function Sidebar({ onComposeClick }: { onComposeClick?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        onCollapse={setCollapsed}
        onComposeClick={onComposeClick}
      />
    </aside>
  );
}

