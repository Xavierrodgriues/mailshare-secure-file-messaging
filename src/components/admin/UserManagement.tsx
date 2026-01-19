import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    UserPlus,
    Trash2,
    Loader2,
    Mail,
    User as UserIcon,
    Lock,
    Edit,
    MoreVertical,
    Search
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
    id: string;
    full_name: string;
    email: string;
}

interface UserManagementProps {
    users: Profile[];
    loading: boolean;
    actionLoading: boolean;
    onAddUser: (data: any) => Promise<void>;
    onUpdateUser: (id: string, data: any) => Promise<void>;
    onDeleteUser: (id: string) => Promise<void>;
    fetchUsers: () => void;
}

export function UserManagement({
    users,
    loading,
    actionLoading,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
    fetchUsers
}: UserManagementProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });

    const [editData, setEditData] = useState({
        fullName: '',
    });

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onAddUser(formData);
        setFormData({ fullName: '', email: '', password: '' });
        setIsAddDialogOpen(false);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        await onUpdateUser(editingUser.id, editData);
        setEditingUser(null);
        setIsEditDialogOpen(false);
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background border px-6 py-4 rounded-xl shadow-sm">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">User Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage system access and user profiles.</p>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="rounded-lg h-10 gap-2 font-semibold shadow-sm transition-all hover:shadow-md"
                >
                    <UserPlus className="h-4 w-4" />
                    Add New User
                </Button>
            </div>

            <Card className="border shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                className="pl-9 h-10 bg-background border-muted"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground font-medium animate-pulse">Fetching user records...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="bg-muted/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <UserIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <p className="text-muted-foreground font-medium">No users found matching your search.</p>
                            <Button
                                variant="ghost"
                                className="mt-2 text-primary hover:text-primary hover:bg-primary/5"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear search
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[300px] font-semibold text-xs uppercase tracking-wider h-12">User Details</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider h-12">Email Identity</TableHead>
                                    <TableHead className="font-semibold text-xs uppercase tracking-wider h-12 text-center">Status</TableHead>
                                    <TableHead className="w-[80px] text-right font-semibold text-xs uppercase tracking-wider h-12 pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/20 transition-colors group border-b last:border-0 h-16">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {user.full_name?.charAt(0) || user.email.charAt(0)}
                                                </div>
                                                <div className="font-bold text-foreground">{user.full_name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                <Mail className="h-3.5 w-3.5" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                Active
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingUser(user);
                                                            setEditData({ fullName: user.full_name });
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                        className="gap-2 cursor-pointer"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteUser(user.id)}
                                                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Remove User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Add User Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Register New User</DialogTitle>
                        <DialogDescription>
                            Create a new account. They'll be able to login with these credentials.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        className="pl-10 h-11"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Work Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@yuvii.com"
                                        className="pl-10 h-11"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Initial Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={actionLoading} className="font-bold min-w-[120px]">
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Edit User Profile</DialogTitle>
                        <DialogDescription>
                            Update the personal information for this user. Email cannot be changed.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground">Email Address</Label>
                                <Input value={editingUser?.email || ''} disabled className="bg-muted/50 h-11 border-dashed" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="editName">Full Name</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="editName"
                                        placeholder="John Doe"
                                        className="pl-10 h-11"
                                        value={editData.fullName}
                                        onChange={(e) => setEditData({ fullName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={actionLoading} className="font-bold min-w-[120px]">
                                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
