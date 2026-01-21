import { LogOut, Search, User, Bell, X, Info, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    SidebarTrigger
} from "@/components/ui/sidebar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminNotification } from "@/pages/AdminDashboard";

interface AdminHeaderProps {
    title: string;
    onLogout: () => void;
    notifications: AdminNotification[];
    onRemoveNotification: (id: string) => void;
    onClearAll: () => void;
}

export function AdminHeader({ title, onLogout, notifications, onRemoveNotification, onClearAll }: AdminHeaderProps) {
    const unreadCount = notifications.length;

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1" />
                <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground relative hover:bg-slate-100 rounded-xl transition-all">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center bg-rose-500 text-[10px] font-bold text-white rounded-full border-2 border-background animate-in zoom-in duration-300">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 mr-4 mt-2 rounded-2xl shadow-2xl border-none ring-1 ring-slate-200" align="end">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50/50 rounded-t-2xl">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Notifications</h3>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClearAll}
                                        className="h-7 text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-tighter"
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            <ScrollArea className="h-[350px]">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                            <Bell className="h-5 w-5 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-900">Quiet for now</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">No activity reported</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map((notif) => (
                                            <div key={notif.id} className="relative p-4 group hover:bg-slate-50 transition-colors">
                                                <div className="flex gap-3">
                                                    <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'login' ? 'bg-indigo-50 text-indigo-600' :
                                                            notif.type === 'logout' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                                                        }`}>
                                                        {notif.type === 'login' ? <ShieldAlert className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 pr-4">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-black text-slate-900">{notif.title}</p>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter whitespace-nowrap">
                                                                {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onRemoveNotification(notif.id)}
                                                    className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-500"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                            {notifications.length > 0 && (
                                <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center rounded-b-2xl">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">End of Activity Loop</p>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>

                    <div className="h-8 w-[1px] bg-border mx-1" />

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-medium">Admin User</span>
                            <span className="text-[10px] text-muted-foreground">Super Administrator</span>
                        </div>
                        <div className="bg-primary/10 h-9 w-9 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <Button
                            onClick={onLogout}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
