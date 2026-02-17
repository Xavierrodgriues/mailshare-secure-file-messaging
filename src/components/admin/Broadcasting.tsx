
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Send, Megaphone, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    adminId: string;
}

export function Broadcasting() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/admin/broadcasts';

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch broadcasts');

            const data = await response.json();
            setBroadcasts(data || []);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
            toast.error('Failed to load broadcasts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Please enter both title and message');
            return;
        }

        setIsSending(true);
        try {
            const token = localStorage.getItem('adminToken');
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/admin/broadcasts';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, message })
            });

            if (!response.ok) throw new Error('Failed to create broadcast');

            toast.success('Broadcast sent successfully');
            setTitle('');
            setMessage('');
            fetchBroadcasts();
        } catch (error) {
            console.error('Error sending broadcast:', error);
            toast.error('Failed to send broadcast');
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this broadcast? This will remove it for all users.')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + `/admin/broadcasts/${id}`;

            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete broadcast');

            toast.success('Broadcast deleted');
            setBroadcasts(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error('Error deleting broadcast:', error);
            toast.error('Failed to delete broadcast');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Broadcasting</h2>
                <p className="text-muted-foreground">
                    Send announcements and updates to all users.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Compose Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-primary" />
                            New Broadcast
                        </CardTitle>
                        <CardDescription>
                            Create a notification that will appear for all users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                placeholder="Announcement Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                placeholder="Type your message here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleSendBroadcast}
                            disabled={isSending}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Broadcast
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* History Section */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Recent Broadcasts</CardTitle>
                        <CardDescription>
                            History of sent announcements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto max-h-[500px] pr-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : broadcasts.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No broadcasts sent yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {broadcasts.map((broadcast) => (
                                    <div
                                        key={broadcast.id}
                                        className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors group relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-base">{broadcast.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground flex items-center bg-muted px-2 py-1 rounded">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {format(new Date(broadcast.createdAt), 'MMM d, yyyy')}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(broadcast.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {broadcast.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
