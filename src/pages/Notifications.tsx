import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Megaphone, Calendar, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Broadcast {
    _id: string;
    id?: string;
    title: string;
    message: string;
    createdAt: string;
    adminId: string;
}

export default function Notifications() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBroadcasts();
    }, []);

    const fetchBroadcasts = async () => {
        try {
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/settings/broadcasts';
            const response = await fetch(apiUrl);

            if (!response.ok) throw new Error('Failed to fetch broadcasts');

            const data = await response.json();

            // Filter out dismissed broadcasts
            const dismissed = JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]');
            const activeBroadcasts = (data || []).filter((b: any) => !dismissed.includes(b._id || b.id));

            setBroadcasts(activeBroadcasts);

            // Mark all active as "seen" in local storage so toast doesn't pop up again
            if (activeBroadcasts.length > 0) {
                const seenBroadcasts = JSON.parse(localStorage.getItem('seenBroadcasts') || '[]');
                const allIds = activeBroadcasts.map((b: any) => b.id || b._id);
                const updatedSeen = Array.from(new Set([...seenBroadcasts, ...allIds]));
                localStorage.setItem('seenBroadcasts', JSON.stringify(updatedSeen));
            }
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDismiss = (id: string) => {
        const dismissed = JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]');
        if (!dismissed.includes(id)) {
            const updatedDismissed = [...dismissed, id];
            localStorage.setItem('dismissedBroadcasts', JSON.stringify(updatedDismissed));

            // Remove locally
            setBroadcasts(prev => prev.filter(b => (b._id || b.id) !== id));
        }
    };

    return (
        <AppLayout>
            <div className="h-full overflow-y-auto">
                <div className="container mx-auto py-6 max-w-4xl">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Megaphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">System Notifications</h1>
                            <p className="text-muted-foreground">
                                Updates and announcements from the administration.
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : broadcasts.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-medium">No Notifications</h3>
                                <p className="text-muted-foreground">
                                    You're all caught up! There are no new announcements.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {broadcasts.map((broadcast) => (
                                <Card
                                    key={broadcast._id || broadcast.id}
                                    className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-200 group relative bg-card/50 hover:bg-card"
                                >
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                            onClick={() => handleDismiss(broadcast._id || broadcast.id || '')}
                                            title="Discard notification"
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Dismiss</span>
                                        </Button>
                                    </div>
                                    <CardHeader className="bg-muted/5 pb-3 pr-12">
                                        <div className="flex flex-col gap-1">
                                            <CardTitle className="text-lg font-semibold text-foreground/90 leading-tight">
                                                {broadcast.title}
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {format(new Date(broadcast.createdAt), 'MMMM d, yyyy • h:mm a')}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 pb-4">
                                        <div className="prose prose-sm max-w-none text-muted-foreground/90 whitespace-pre-wrap leading-relaxed">
                                            {broadcast.message}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
