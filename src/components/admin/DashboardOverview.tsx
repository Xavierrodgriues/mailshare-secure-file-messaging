import {
    Users,
    Activity,
    ShieldCheck,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DashboardOverviewProps {
    totalUsers: number;
}

export function DashboardOverview({ totalUsers }: DashboardOverviewProps) {
    const stats = [
        {
            title: "Total Registered Users",
            value: totalUsers.toString(),
            description: "Across all departments",
            icon: Users,
            trend: "+12% from last month",
            trendType: "up",
            color: "text-blue-600",
            bgColor: "bg-blue-100/50",
        },
        {
            title: "Active Sessions",
            value: "24",
            description: "Live system connections",
            icon: Activity,
            trend: "+5.4% increase",
            trendType: "up",
            color: "text-emerald-600",
            bgColor: "bg-emerald-100/50",
        },
        {
            title: "Security Incidents",
            value: "0",
            description: "In the last 24 hours",
            icon: ShieldCheck,
            trend: "All systems clear",
            trendType: "neutral",
            color: "text-indigo-600",
            bgColor: "bg-indigo-100/50",
        },
        {
            title: "System Uptime",
            value: "99.9%",
            description: "Cloud server status",
            icon: Clock,
            trend: "Stable connection",
            trendType: "neutral",
            color: "text-amber-600",
            bgColor: "bg-amber-100/50",
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">Real-time metrics and system health monitoring.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bgColor} p-2.5 rounded-xl transition-transform group-hover:scale-110`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-xs text-muted-foreground font-medium">
                                    {stat.description}
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.trendType === 'up' ? 'bg-emerald-50 text-emerald-600' :
                                        stat.trendType === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                                    }`}>
                                    {stat.trend}
                                </span>
                                {stat.trendType === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                                {stat.trendType === 'down' && <ArrowDownRight className="h-3 w-3 text-rose-500" />}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                <Card className="rounded-2xl border shadow-sm h-[320px] flex items-center justify-center bg-muted/20 border-dashed">
                    <div className="text-center p-8">
                        <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Activity className="h-6 w-6 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold">Analytics Chart Portfolio</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto"> Detailed user engagement and traffic analytics will be integrated here.</p>
                    </div>
                </Card>
                <Card className="rounded-2xl border shadow-sm h-[320px] flex items-center justify-center bg-muted/20 border-dashed">
                    <div className="text-center p-8">
                        <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <ShieldCheck className="h-6 w-6 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-lg font-bold">Recent Security Activity</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">Real-time log of security events and authentication attempts.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
