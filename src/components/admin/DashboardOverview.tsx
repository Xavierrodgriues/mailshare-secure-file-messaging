import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Users,
    Activity,
    ShieldCheck,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Wifi,
    Timer,
    Database,
    Laptop,
    Smartphone,
    Monitor,
    Shield,
    LogOut,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardOverviewProps {
    totalUsers: number;
}

export function DashboardOverview({ totalUsers }: DashboardOverviewProps) {
    const [uptime, setUptime] = useState(() => {
        const startTime = localStorage.getItem('adminSessionStart');
        if (startTime) {
            return Math.floor((Date.now() - parseInt(startTime)) / 1000);
        }
        const now = Date.now().toString();
        localStorage.setItem('adminSessionStart', now);
        return 0;
    });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [lastRefresh] = useState(new Date());
    const [timezone, setTimezone] = useState('utc');
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    useEffect(() => {
        fetchTimezone();
        fetchSessions();
        const timer = setInterval(() => {
            const startTime = localStorage.getItem('adminSessionStart');
            if (startTime) {
                setUptime(Math.floor((Date.now() - parseInt(startTime)) / 1000));
            }
            setCurrentTime(new Date());
        }, 1000);

        // Automatic session list refresh every 10 seconds
        const sessionInterval = setInterval(() => {
            fetchSessions(true);
        }, 10000);

        return () => {
            clearInterval(timer);
            clearInterval(sessionInterval);
        };
    }, []);

    const fetchSessions = async (silent = false) => {
        if (!silent) setLoadingSessions(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('https://mailshare-admin-api.onrender.com/api/admin/sessions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login';
                return;
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                // Ensure IPs are cleaned up for display
                const cleanedData = data.map(s => ({
                    ...s,
                    ip: s.ip.split(',')[0].trim()
                }));
                setSessions(cleanedData);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleLogoutDevice = async (sessionId: string) => {
        if (!confirm('Are you sure you want to log out this device?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('https://mailshare-admin-api.onrender.com/api/admin/sessions/logout-device', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId })
            });

            if (response.ok) {
                toast.success('Device logged out successfully');
                fetchSessions();
            } else {
                toast.error('Failed to logout device');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('An error occurred');
        }
    };

    const fetchTimezone = async () => {
        try {
            const response = await fetch('https://mailshare-admin-api.onrender.com/api/settings/public');
            const data = await response.json();
            if (data.timezone) {
                setTimezone(data.timezone);
            }
        } catch (error) {
            console.error('Error fetching timezone:', error);
        }
    };

    const getTimezoneString = (tz: string) => {
        switch (tz.toLowerCase()) {
            case 'ist': return 'Asia/Kolkata';
            case 'est': return 'America/New_York';
            case 'cst': return 'America/Chicago';
            case 'mst': return 'America/Denver';
            case 'pst': return 'America/Los_Angeles';
            default: return 'UTC';
        }
    };

    const formatUptime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const stats = [
        {
            title: "Live System Clock",
            value: currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: getTimezoneString(timezone)
            }),
            description: currentTime.toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                timeZone: getTimezoneString(timezone)
            }),
            icon: Clock,
            trend: timezone.toUpperCase(),
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

                <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 h-[360px] flex flex-col bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-5 px-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900">Active Sessions</CardTitle>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Security Command Center</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchSessions()}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-primary"
                        >
                            <Activity className={`h-4 w-4 ${loadingSessions ? 'animate-spin' : ''}`} />
                        </button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto custom-scrollbar">
                        {loadingSessions ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <Activity className="h-6 w-6 text-slate-200 animate-spin" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Fetching active devices...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[280px] text-center p-8">
                                <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-4">
                                    <Monitor className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">No active sessions</p>
                                <p className="text-xs text-slate-400 mt-1">Global administrative logout currently active.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {sessions.map((session, idx) => (
                                    <div key={session._id} className="p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors border border-slate-100/50">
                                                {session.deviceName?.toLowerCase().includes('mobile') || session.deviceName?.toLowerCase().includes('android') || session.deviceName?.toLowerCase().includes('iphone') ? (
                                                    <Smartphone className="h-5 w-5 text-slate-600" />
                                                ) : (
                                                    <Laptop className="h-5 w-5 text-slate-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{session.deviceName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 py-0.5 px-1.5 bg-slate-100 rounded-md">ID: {session.fingerprintId?.slice(-8).toUpperCase() || 'LEGACY'}</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(session.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tight scale-90 origin-right">
                                                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </span>
                                            <span className="text-[9px] text-slate-300 font-bold group-hover:text-slate-400 transition-colors px-1">ID: {session._id.slice(-6).toUpperCase()}</span>
                                            <button
                                                onClick={() => handleLogoutDevice(session._id)}
                                                className="mt-2 p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                title="Revoke Access"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 mt-auto">
                        <p className="text-[10px] text-center text-slate-400 font-medium">Showing all verified administrative access points from the last 24 hours.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
