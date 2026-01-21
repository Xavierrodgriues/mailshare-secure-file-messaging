import { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Shield,
    Globe,
    Bell,
    Zap,
    Lock,
    Save,
    Mail,
    Building2,
    Database,
    Fingerprint,
    Languages,
    HardDrive,
    Info,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function Settings() {
    const [loading, setLoading] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [domainWhitelistEnabled, setDomainWhitelistEnabled] = useState(true);
    const [locale, setLocale] = useState('en-us');
    const [timezone, setTimezone] = useState('utc');
    const [shortSessionTimeout, setShortSessionTimeout] = useState(false);
    const [storageStats, setStorageStats] = useState<any>(null);

    useEffect(() => {
        fetchSettings();
        fetchStorageStats();
    }, []);

    const fetchStorageStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:5000/api/admin/storage/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setStorageStats(data);
        } catch (error) {
            console.error('Error fetching storage stats:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:5000/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.maintenanceMode !== undefined) {
                setMaintenanceMode(data.maintenanceMode);
            }
            if (data.domainWhitelistEnabled !== undefined) {
                setDomainWhitelistEnabled(data.domainWhitelistEnabled);
            }
            if (data.locale) setLocale(data.locale);
            if (data.timezone) setTimezone(data.timezone);
            if (data.shortSessionTimeout !== undefined) {
                setShortSessionTimeout(data.shortSessionTimeout);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const saveSettings = async (updates: { maintenanceMode?: boolean, domainWhitelistEnabled?: boolean, locale?: string, timezone?: string, shortSessionTimeout?: boolean }) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:5000/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                if (updates.maintenanceMode !== undefined) {
                    toast.success(`Maintenance mode ${updates.maintenanceMode ? 'enabled' : 'disabled'}`);
                } else if (updates.domainWhitelistEnabled !== undefined) {
                    toast.success(`Domain white-listing ${updates.domainWhitelistEnabled ? 'enabled' : 'disabled'}`);
                } else if (updates.locale || updates.timezone) {
                    toast.success("Regional settings updated");
                } else if (updates.shortSessionTimeout !== undefined) {
                    toast.success(`Session persistence ${updates.shortSessionTimeout ? 'enabled' : 'disabled'}`);
                }
            } else {
                toast.error("Failed to update settings");
            }
        } catch (error) {
            toast.error("An error occurred while saving settings");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:5000/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ maintenanceMode, domainWhitelistEnabled, locale, timezone, shortSessionTimeout })
            });

            if (response.ok) {
                toast.success("Configuration updated successfully");
            } else {
                const errorData = await response.json();
                toast.error(`Failed to update configuration: ${errorData.error || response.statusText}`);
            }
        } catch (error) {
            toast.error("An error occurred while saving. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Platform Configuration</h2>
                    <p className="text-slate-500 mt-2 font-medium">Control global system parameters, security policies, and application branding.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-white px-8 rounded-2xl h-12 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {loading ? <Zap className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="identity" className="space-y-8">
                <TabsList className="bg-slate-100 p-1.5 rounded-[20px] h-14 w-full md:w-auto overflow-x-auto justify-start md:justify-center">
                    <TabsTrigger value="identity" className="rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-11">
                        <Building2 className="h-4 w-4 mr-2" />
                        Identity
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-11">
                        <Shield className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-11">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold transition-all h-11">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Advanced
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 overflow-hidden">
                                <CardHeader className="border-b border-slate-50 pb-6 bg-slate-50/30">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-primary" />
                                        General Branding
                                    </CardTitle>
                                    <CardDescription className="font-medium">Define how the system identifies itself to users.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2.5">
                                            <Label className="text-slate-700 font-bold ml-1">Platform Name</Label>
                                            <Input defaultValue="Yuvii Admin Portal" className="h-12 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary/10 transition-all font-medium" />
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-slate-700 font-bold ml-1">Organization Identifier</Label>
                                            <Input defaultValue="Yuviiconsultancy" className="h-12 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary/10 transition-all font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-slate-700 font-bold ml-1">Support Endpoint Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <Input defaultValue="support@yuviiconsultancy.com" className="h-12 pl-11 rounded-2xl border-slate-200 focus:border-primary focus:ring-primary/10 transition-all font-medium" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 overflow-hidden">
                                <CardHeader className="border-b border-slate-50 pb-6 bg-slate-50/30">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        <Languages className="h-5 w-5 text-indigo-500" />
                                        Regional Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label className="text-slate-700 font-bold ml-1">Default Locale</Label>
                                        <Select
                                            value={locale}
                                            onValueChange={(val) => {
                                                setLocale(val);
                                                saveSettings({ locale: val });
                                            }}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-primary/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en-us">English (US)</SelectItem>
                                                <SelectItem value="en-gb">English (UK)</SelectItem>
                                                <SelectItem value="es">Español</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-slate-700 font-bold ml-1">Timezone Synchronization</Label>
                                        <Select
                                            value={timezone}
                                            onValueChange={(val) => {
                                                setTimezone(val);
                                                saveSettings({ timezone: val });
                                            }}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 focus:ring-primary/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                                                <SelectItem value="ist">IST (India Standard Time)</SelectItem>
                                                <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                                                <SelectItem value="cst">CST (Central Standard Time)</SelectItem>
                                                <SelectItem value="mst">MST (Mountain Standard Time)</SelectItem>
                                                <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="h-fit rounded-[32px] border-none shadow-xl shadow-slate-200/40 bg-gradient-to-br from-primary/10 to-indigo-500/10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Building2 className="h-32 w-32" />
                            </div>
                            <CardContent className="p-8 relative z-10 space-y-6">
                                <h4 className="font-black text-primary text-xs uppercase tracking-[0.2em]">Deployment Info</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-bold">Registry Status</span>
                                        <span className="bg-white/60 backdrop-blur px-3 py-1 rounded-full text-primary font-black text-[10px]">VERIFIED</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-bold">App Version</span>
                                        <span className="text-slate-900 font-mono font-bold">v3.4.0-stable</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-bold">Environment</span>
                                        <span className="text-slate-900 font-bold">Production Cluster</span>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button variant="outline" className="w-full rounded-2xl border-white bg-white/40 hover:bg-white/60 font-bold text-slate-700 border-none shadow-sm h-12">
                                        View Manifest Data
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 overflow-hidden">
                            <CardHeader className="bg-slate-900 text-white pb-8">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Fingerprint className="h-5 w-5 text-primary" />
                                    Access Constraints
                                </CardTitle>
                                <CardDescription className="text-slate-400 font-medium">Configure how users authenticate with the system.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-primary/20">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Domain White-listing</p>
                                        <p className="text-xs text-slate-500 font-medium">Allow registeration to only @yuviiconsultancy.com</p>
                                    </div>
                                    <Switch
                                        checked={domainWhitelistEnabled}
                                        onCheckedChange={(checked) => {
                                            setDomainWhitelistEnabled(checked);
                                            saveSettings({ domainWhitelistEnabled: checked });
                                        }}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-primary/20">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Force Admin TOTP</p>
                                        <p className="text-xs text-slate-500 font-medium">Require 2FA for all administrative accounts</p>
                                    </div>
                                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-primary/20">
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Session Persistence</p>
                                        <p className="text-xs text-slate-500 font-medium">Invalidate sessions after 24 hours of inactivity</p>
                                    </div>
                                    <Switch
                                        checked={shortSessionTimeout}
                                        onCheckedChange={(checked) => {
                                            setShortSessionTimeout(checked);
                                            saveSettings({ shortSessionTimeout: checked });
                                        }}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-8">
                            <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/5 overflow-hidden bg-white group">
                                <CardHeader className="p-8 pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                                            <div className="p-2.5 bg-primary/10 rounded-2xl">
                                                <HardDrive className="h-6 w-6 text-primary" />
                                            </div>
                                            Cloud Storage Usage
                                        </CardTitle>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${storageStats?.status === 'warning'
                                                ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {storageStats?.status === 'warning' ? 'Critical Usage' : 'System Healthy'}
                                        </div>
                                    </div>
                                    <CardDescription className="text-slate-400 font-medium pl-14">
                                        Storage health diagnostics from Cloudflare R2 Gateway.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-8 pt-10 space-y-10">
                                    {/* Mobile Style Storage Bar */}
                                    <div className="space-y-6">
                                        <div className="flex items-end justify-between px-1">
                                            <div className="space-y-1">
                                                <p className="text-4xl font-black text-slate-900 tracking-tighter">
                                                    {storageStats ? (storageStats.totalBytes / (1024 * 1024 * 1024)).toFixed(2) : '0.00'}
                                                    <span className="text-lg text-slate-400 ml-2 tracking-normal font-bold">GB</span>
                                                </p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    of {(storageStats?.quotaLimit / (1024 * 1024 * 1024)) || 5} GB Total Capacity
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-primary">
                                                    {storageStats?.percentageUsed?.toFixed(1) || '0.0'}%
                                                </p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Occupied</p>
                                            </div>
                                        </div>

                                        <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden flex shadow-inner p-1 border border-slate-100/50">
                                            {storageStats?.breakdown ? storageStats.breakdown.map((item: any, idx: number) => (
                                                <div
                                                    key={item.name}
                                                    className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-700 delay-${idx * 100} ${item.color}`}
                                                    style={{ width: `${(item.bytes / storageStats.quotaLimit) * 100}%` }}
                                                />
                                            )) : (
                                                <div className="h-full w-0 bg-primary transition-all duration-1000" />
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-6 px-1">
                                            {storageStats?.breakdown?.map((item: any) => (
                                                <div key={item.name} className="flex items-center gap-2">
                                                    <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">{(item.bytes / (1024 * 1024)).toFixed(1)}MB</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-slate-50/50 rounded-[24px] border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-indigo-50 rounded-xl">
                                                    <Mail className="h-4 w-4 text-indigo-600" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Objects</p>
                                            </div>
                                            <p className="text-xl font-black text-slate-800">{storageStats?.fileCount || 0}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Active R2 Blobs</p>
                                        </div>

                                        <div className="p-5 bg-slate-50/50 rounded-[24px] border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-amber-50 rounded-xl">
                                                    <Database className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bucket Name</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 truncate">{storageStats?.bucketName || 'N/A'}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Cloudflare Target</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                Last Synced: {storageStats ? new Date(storageStats.lastUpdated).toLocaleTimeString() : '---'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-600/70 uppercase tracking-tighter">Live Connection</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none">
                    <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/40 p-12 text-center">
                        <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="h-10 w-10 text-slate-300 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">Push Notification Gateway</h3>
                        <p className="text-slate-500 mt-3 max-w-lg mx-auto leading-relaxed">
                            Configure internal SMTP relays and external notification providers (Firebase/OneSignal) to keep your team synchronized in real-time.
                        </p>
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-slate-200 text-slate-600">
                                Configure Webhooks
                            </Button>
                            <Button className="rounded-full px-8 h-12 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                                Setup SMTP Relay
                            </Button>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 focus-visible:outline-none">
                    <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/40 overflow-hidden ring-4 ring-rose-500/5 transition-all hover:ring-rose-500/10">
                        <div className="bg-rose-500/10 p-8 flex items-center gap-4 border-b border-rose-100">
                            <div className="h-12 w-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                                <Zap className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-rose-900">Danger Zone</h3>
                                <p className="text-rose-600/70 text-sm font-medium">Critical system-wide administrative controls.</p>
                            </div>
                        </div>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-6 bg-white border-2 border-slate-50 rounded-3xl transition-all hover:border-rose-100 group">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-rose-600 transition-colors">Platform Maintenance Mode</p>
                                    <p className="text-xs text-slate-500 font-medium">Disable all public user access while performing updates.</p>
                                </div>
                                <Switch
                                    checked={maintenanceMode}
                                    onCheckedChange={(checked) => {
                                        setMaintenanceMode(checked);
                                        // Auto-save maintenance mode for better UX
                                        saveSettings({ maintenanceMode: checked });
                                    }}
                                    className="data-[state=checked]:bg-rose-500"
                                />

                            </div>
                            {/* <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <Button variant="destructive" className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-500/10">
                                    Clear System Cache
                                </Button>
                                <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black uppercase text-xs tracking-widest border-2 border-slate-100 hover:border-rose-100 text-slate-600">
                                    Factory System Reset
                                </Button>
                            </div> */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="pt-10 text-center border-t border-slate-100">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                    <span className="h-px w-8 bg-slate-100" />
                    Secure Infrastructure Management v3.4
                    <span className="h-px w-8 bg-slate-100" />
                </p>
            </div>
        </div>
    );
}
