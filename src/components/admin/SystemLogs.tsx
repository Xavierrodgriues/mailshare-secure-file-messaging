import { useState, useEffect } from 'react';
import {
    FileText,
    AlertCircle,
    Shield,
    LogIn,
    LogOut,
    UserPlus,
    UserMinus,
    Settings as SettingsIcon,
    RefreshCw,
    Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { io } from 'socket.io-client';
import { cn } from "@/lib/utils";

interface LogEntry {
    _id: string;
    adminId: string;
    email: string;
    action: 'LOGIN' | 'LOGOUT' | 'USER_DELETED' | 'USER_REGISTERED' | 'SESSION_REVOKED' | 'SETTINGS_CHANGED' | 'SYSTEM_ALERT';
    details: string;
    ip: string;
    timestamp: string;
}

export function SystemLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLogs();

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socket = io(apiUrl.replace('/api', ''));
        socket.on('system_log', (newLog: LogEntry) => {
            setLogs(prev => [newLog, ...prev].slice(0, 100));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/admin/logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setLogs(data);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getLogIcon = (action: string) => {
        switch (action) {
            case 'LOGIN': return <LogIn className="h-4 w-4 text-emerald-500" />;
            case 'LOGOUT': return <LogOut className="h-4 w-4 text-rose-500" />;
            case 'USER_DELETED': return <UserMinus className="h-4 w-4 text-rose-500" />;
            case 'USER_REGISTERED': return <UserPlus className="h-4 w-4 text-blue-500" />;
            case 'SESSION_REVOKED': return <Shield className="h-4 w-4 text-amber-500" />;
            case 'SETTINGS_CHANGED': return <SettingsIcon className="h-4 w-4 text-indigo-500" />;
            case 'SYSTEM_ALERT': return <AlertCircle className="h-4 w-4 text-rose-600" />;
            default: return <FileText className="h-4 w-4 text-slate-400" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'LOGIN': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'LOGOUT': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'USER_DELETED': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'USER_REGISTERED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'SESSION_REVOKED': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'SETTINGS_CHANGED': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">System Audit Logs</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Real-time Monitoring Active
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm group"
                >
                    <RefreshCw className={cn("h-4 w-4 text-slate-400 group-hover:text-primary transition-all", isLoading && "animate-spin")} />
                </button>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden">
                <CardHeader className="border-b border-slate-50 p-6 flex flex-row items-center justify-between bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black text-slate-900">Live Activity Feed</CardTitle>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Protocol Alpha Compliance</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-500 tracking-tighter">
                        {logs.length} Total Events
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
                                <Activity className="h-8 w-8 text-primary relative animate-spin-slow" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Synchronizing Logs...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
                            <div className="bg-slate-50 w-20 h-20 rounded-[32px] flex items-center justify-center mb-6 border border-slate-100 transition-transform hover:scale-110 duration-500">
                                <FileText className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase">Clear Horizon</h3>
                            <p className="text-xs text-slate-400 mt-2 font-medium max-w-[240px]">No system events recorded in the current audit cycle.</p>
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                            {logs.map((log) => (
                                <div key={log._id} className="p-5 hover:bg-slate-50/80 transition-all group flex items-start gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110",
                                        getActionColor(log.action)
                                    )}>
                                        {getLogIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight",
                                                getActionColor(log.action)
                                            )}>
                                                {log.action.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-slate-300 font-bold">•</span>
                                            <span className="text-[10px] text-slate-400 font-bold tracking-tight">
                                                {new Date(log.timestamp).toLocaleString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 mb-1">{log.details}</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] text-slate-400 font-medium">By: <span className="font-black text-slate-600 underline decoration-slate-200 underline-offset-2">{log.email}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                <span className="text-[10px] text-slate-400 font-medium">IP: <span className="font-mono font-bold text-slate-500">{log.ip}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                        Certified Audit Record • System Integrity Validated
                    </p>
                </div>
            </Card>
        </div>
    );
}
