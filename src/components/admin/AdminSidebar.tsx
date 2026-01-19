import {
    Users,
    FileText,
    Settings,
    LayoutDashboard,
    ShieldCheck
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
    {
        title: "Overview",
        url: "overview",
        icon: LayoutDashboard,
    },
    {
        title: "User Management",
        url: "users",
        icon: Users,
    },
    {
        title: "System Logs",
        url: "logs",
        icon: FileText,
    },
    {
        title: "Settings",
        url: "settings",
        icon: Settings,
    },
];

interface AdminSidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
}

export function AdminSidebar({ currentView, onViewChange }: AdminSidebarProps) {
    return (
        <Sidebar>
            <SidebarHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AdminPanel</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="px-6 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                        Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="px-3">
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        onClick={() => onViewChange(item.url)}
                                        isActive={currentView === item.url}
                                        tooltip={item.title}
                                        className="w-full h-11 px-3 rounded-xl transition-all duration-200 hover:bg-primary/5 group"
                                    >
                                        <item.icon className={`h-5 w-5 transition-colors ${currentView === item.url ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                                        <span className={`font-medium ${currentView === item.url ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <div className="bg-muted/50 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-muted-foreground">Admin Access</p>
                    <p className="text-[10px] text-muted-foreground mt-1 opacity-70">Internal Management System</p>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
