import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Trash2, LogOut, Loader2, Mail, User as UserIcon, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });

    const [editData, setEditData] = useState({
        fullName: '',
    });

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            navigate('/admin/login');
            return;
        }
        fetchUsers();
    }, [navigate]);

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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            // Register via Supabase Auth
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

            // Important: Sign the user out immediately. 
            // supabase.auth.signUp automatically signs the client in as the new user, 
            // which we don't want for the admin session.
            await supabase.auth.signOut();

            toast.success('User registered successfully');
            setFormData({ fullName: '', email: '', password: '' });
            setShowAddForm(false);
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to register user: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setActionLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: editData.fullName })
                .eq('id', editingUser.id);

            if (error) throw error;

            toast.success('User updated successfully');
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            toast.error('Failed to update user: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

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
            if (!res.ok) throw new Error(data.error);

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
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[#E2E8F0]">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#3B82F6]/10 p-2 rounded-lg">
                            <UserIcon className="h-6 w-6 text-[#3B82F6]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1E293B]">Admin Dashboard</h1>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl flex gap-2 items-center px-6 h-11"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Management Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                            <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <UserPlus className="h-5 w-5 text-[#3B82F6]" />
                                    Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Button
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    className="w-full h-12 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl flex gap-2 items-center justify-center font-bold transition-all"
                                >
                                    {showAddForm ? 'Hide Form' : 'Add New User'}
                                </Button>
                            </CardContent>
                        </Card>

                        {showAddForm && (
                            <Card className="border-none shadow-lg rounded-2xl bg-white animate-in slide-in-from-top duration-300">
                                <CardHeader>
                                    <CardTitle className="text-xl">Register User</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
                                            <div className="relative">
                                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="fullName"
                                                    placeholder="John Doe"
                                                    className="pl-10 h-11 rounded-xl"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-semibold">Email (@yuvii.com)</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="user@yuvii.com"
                                                    className="pl-10 h-11 rounded-xl"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-sm font-semibold">Initial Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="pl-10 h-11 rounded-xl"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                            disabled={actionLoading}
                                        >
                                            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                            Create Account
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* User List */}
                    <div className="lg:col-span-2">
                        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                            <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-6">
                                <CardTitle className="text-xl">Registered Users</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-[#3B82F6]" />
                                        <p className="text-gray-500 font-medium">Loading users...</p>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <p className="text-gray-500 font-medium">No users registered yet.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#F8FAFC] text-[#64748B] text-xs uppercase tracking-wider">
                                                    <th className="px-6 py-4 font-bold border-b border-[#E2E8F0]">User</th>
                                                    <th className="px-6 py-4 font-bold border-b border-[#E2E8F0]">Email</th>
                                                    <th className="px-6 py-4 font-bold border-b border-[#E2E8F0] text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#E2E8F0]">
                                                {users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-[#1E293B]">{user.full_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-[#64748B] text-sm">{user.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setEditingUser(user);
                                                                        setEditData({ fullName: user.full_name });
                                                                    }}
                                                                    className="text-gray-400 hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg h-9 w-9 transition-all"
                                                                    disabled={actionLoading}
                                                                >
                                                                    <UserIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="text-gray-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg h-9 w-9 transition-all"
                                                                    disabled={actionLoading}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Edit User Modal/Overlay */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <Card className="w-full max-w-md border-none shadow-2xl rounded-2xl bg-white animate-in zoom-in-95 duration-200">
                            <CardHeader>
                                <CardTitle className="text-xl">Edit User</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-[#64748B]">Email (Read-only)</Label>
                                        <Input
                                            value={editingUser.email}
                                            disabled
                                            className="bg-gray-50 border-[#E2E8F0] h-11 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="editName" className="text-sm font-semibold">Full Name</Label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="editName"
                                                placeholder="John Doe"
                                                className="pl-10 h-11 rounded-xl"
                                                value={editData.fullName}
                                                onChange={(e) => setEditData({ fullName: e.target.value })}
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingUser(null)}
                                            className="flex-1 h-11 rounded-xl"
                                            disabled={actionLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-1 h-11 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-bold"
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
