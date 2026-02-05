import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemLogs } from '@/components/admin/SystemLogs';
import { Settings } from '@/components/admin/Settings';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export interface AdminNotification {
    id: string;
    title: string;
    message: string;
    time: Date;
    type: 'login' | 'logout' | 'system';
    read: boolean;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentView, setCurrentView] = useState('overview');
    const [domainWhitelistEnabled, setDomainWhitelistEnabled] = useState(true);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            navigate('/admin/login');
            return;
        }

        // Setup Socket.io for real-time updates and notifications
        socketRef.current = io('https://mailshare-admin-api.onrender.com');

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
        });

        socketRef.current.on('session_update', (data) => {
            console.log('Session update received:', data);

            // Trigger session refresh in DashboardOverview if it's rendered
            setSessionRefreshTrigger(prev => prev + 1);

            // Add notification for new logins
            if (data.type === 'login') {
                const newNotif: AdminNotification = {
                    id: uuidv4(),
                    title: 'New Admin Login',
                    message: `${data.email} has logged into the admin panel.`,
                    time: new Date(),
                    type: 'login',
                    read: false
                };
                setNotifications(prev => [newNotif, ...prev]);

                // Enhanced toast notification
                toast.success('Security Alert: New Admin Login', {
                    description: `${data.email} just accessed the dashboard.`,
                    duration: 5000,
                });
            }

            // Handle timeout notification
            if (data.type === 'logout' && data.reason === 'timeout') {
                toast.error('Session Expired', {
                    description: 'Your session has been terminated due to inactivity.',
                    duration: 10000,
                });
                handleLogout();
            }
        });

        fetchUsers();
        fetchSettings();

        // Background session validity check
        const interval = setInterval(() => {
            fetchSettings(true); // Pass true for background poll
        }, 5000);

        return () => {
            clearInterval(interval);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [navigate]);

    const fetchSettings = async (isBackground = false) => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${token}`
            };

            if (isBackground) {
                headers['X-Background-Poll'] = 'true';
            }

            const response = await fetch('https://mailshare-admin-api.onrender.com/api/settings', {
                headers
            });
            if (response.status === 401) {
                handleLogout();
                return;
            }
            const data = await response.json();
            if (data.domainWhitelistEnabled !== undefined) {
                setDomainWhitelistEnabled(data.domainWhitelistEnabled);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch users: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (formData: any) => {
        const email = formData.email.toLowerCase();
        if (domainWhitelistEnabled && !email.endsWith('@yuviiconsultancy.com') && !email.endsWith('@yuviiconsultancy.internal')) {
            toast.error('Email should be @yuviiconsultancy.com or @yuviiconsultancy.internal');
            return;
        }
        setActionLoading(true);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Important: Sign the user out immediately as signUp signs them in.
            await supabase.auth.signOut();

            toast.success('User registered successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to register user: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async (userId: string, editData: any) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: editData.fullName })
                .eq('id', userId);

            if (error) throw error;

            toast.success('User updated successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to update user: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setActionLoading(true);
        try {
            const adminToken = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete user');

            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error: any) {
            toast.error('Delete failed: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminSessionStart');
        navigate('/admin/login');
    };

    const getViewTitle = () => {
        switch (currentView) {
            case 'overview': return 'Dashboard Overview';
            case 'users': return 'User Management';
            case 'logs': return 'System Activity Logs';
            case 'settings': return 'Platform Settings';
            default: return 'Admin Dashboard';
        }
    };

    const handleRemoveNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleClearAllNotifications = () => {
        setNotifications([]);
    };

    const renderView = () => {
        switch (currentView) {
            case 'overview':
                return (
                    <DashboardOverview
                        totalUsers={users.length}
                        onLogout={handleLogout}
                        refreshTrigger={sessionRefreshTrigger}
                    />
                );
            case 'users':
                return (
                    <UserManagement
                        users={users}
                        loading={loading}
                        actionLoading={actionLoading}
                        onAddUser={handleAddUser}
                        onUpdateUser={handleUpdateUser}
                        onDeleteUser={handleDeleteUser}
                        fetchUsers={fetchUsers}
                        domainWhitelistEnabled={domainWhitelistEnabled}
                    />
                );
            case 'logs':
                return <SystemLogs />;
            case 'settings':
                return <Settings />;
            default:
                return <DashboardOverview totalUsers={users.length} refreshTrigger={sessionRefreshTrigger} />;
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-slate-50/50">
                <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
                <SidebarInset className="flex flex-col">
                    <AdminHeader
                        title={getViewTitle()}
                        onLogout={handleLogout}
                        notifications={notifications}
                        onRemoveNotification={handleRemoveNotification}
                        onClearAll={handleClearAllNotifications}
                    />
                    <main className="flex-1 p-6 md:p-8 lg:p-10">
                        <div className="mx-auto max-w-7xl">
                            {renderView()}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
