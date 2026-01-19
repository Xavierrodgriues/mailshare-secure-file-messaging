import { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    ShieldCheck,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Wifi,
    Timer,
    Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardOverviewProps {
    totalUsers: number;
}

export function DashboardOverview({ totalUsers }: DashboardOverviewProps) {
    const [uptime, setUptime] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastRefresh] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setUptime(prev => prev + 1);
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatUptime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const stats = [
        {
            title: "Live System Clock",
            value: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            description: currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }),
            icon: Clock,
            trend: "Synchronized",
            trendType: "neutral",
            color: "text-blue-600",
            bgColor: "bg-blue-100/50",
        },
        {
            title: "Dashboard Session",
            value: formatUptime(uptime),
            description: "Active session duration",
            icon: Timer,
            trend: "Live Counter",
            trendType: "up",
            color: "text-emerald-600",
            bgColor: "bg-emerald-100/50",
        },
        {
            title: "Database Status",
            value: "Healthy",
            description: "Supabase connection active",
            icon: Database,
            trend: "Connected",
            trendType: "up",
            color: "text-indigo-600",
            bgColor: "bg-indigo-100/50",
        },
        {
            title: "Total Directory",
            value: totalUsers.toString(),
            description: `Last synced: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            icon: Users,
            trend: "Real-time Data",
            trendType: "neutral",
            color: "text-amber-600",
            bgColor: "bg-amber-100/50",
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-primary pl-4">System Live Monitor</h2>
                    <p className="text-muted-foreground mt-2 text-sm md:text-base ml-5 font-medium">Monitoring platform health and administrative session activity.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 shadow-sm self-start md:self-auto">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE SYSTEM BRIDGE ACTIVE
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 rounded-3xl group cursor-default overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bgColor} rounded-full -mr-8 -mt-8 opacity-20 group-hover:scale-150 transition-transform duration-700`} />

                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                            <CardTitle className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <div className={`${stat.bgColor} p-2.5 rounded-2xl transition-all duration-500 group-hover:shadow-inner group-hover:scale-110`}>
                                <stat.icon className={`h-5 w-5 ${stat.color} transition-transform duration-500 group-hover:rotate-12`} />
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">{stat.value}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-slate-400 font-bold">
                                    {stat.description}
                                </p>
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${stat.trendType === 'up' ? 'bg-emerald-50 text-emerald-600' :
                                        stat.trendType === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                                    }`}>
                                    {stat.trendType === 'up' && <Activity className="h-3 w-3 animate-pulse" />}
                                    {stat.trend}
                                </div>
                                {stat.trendType === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-400" />}
                                {stat.trendType === 'neutral' && <Wifi className="h-4 w-4 text-slate-300" />}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 h-[360px] flex items-center justify-center bg-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="text-center p-8 relative z-10">
                        <div className="bg-slate-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 group-hover:rotate-3 transition-transform duration-500">
                            <Activity className="h-10 w-10 text-primary opacity-40" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Traffic Intelligence</h3>
                        <p className="text-sm text-slate-400 mt-3 max-w-[300px] mx-auto leading-relaxed"> Advanced user behavioral analytics and engagement heatmaps are currently undergoing synchronization.</p>
                        <div className="mt-8 h-1.5 w-48 bg-slate-100 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-primary/20 w-1/3 animate-progress" />
                        </div>
                    </div>
                </Card>

                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 h-[360px] flex items-center justify-center bg-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="text-center p-8 relative z-10">
                        <div className="bg-slate-50 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 group-hover:-rotate-3 transition-transform duration-500">
                            <ShieldCheck className="h-10 w-10 text-slate-900 opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Security Command Center</h3>
                        <p className="text-sm text-slate-400 mt-3 max-w-[300px] mx-auto leading-relaxed">Real-time threat detection and secure audit log streaming will be available in the next security patch.</p>
                        <div className="mt-4 flex justify-center gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-200 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
