import { LogOut, Search, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    SidebarTrigger
} from "@/components/ui/sidebar";

interface AdminHeaderProps {
    title: string;
    onLogout: () => void;
}

export function AdminHeader({ title, onLogout }: AdminHeaderProps) {
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
                    <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                    </Button>

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
