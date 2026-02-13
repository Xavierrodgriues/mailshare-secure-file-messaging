import { AppLayout } from '@/components/layout/AppLayout';
import { useBroadcasts } from '@/hooks/useBroadcasts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function Notifications() {
    const { broadcasts, isLoading, dismissBroadcast } = useBroadcasts();

    return (
        <AppLayout>
            <div className="h-full overflow-y-auto">
                <div className="container mx-auto py-6 max-w-4xl">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Bell className="h-6 w-6 text-primary" />
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
                                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-medium">No Notifications</h3>
                                <p className="text-muted-foreground">
                                    You're all caught up! There are no new announcements.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {broadcasts.map((broadcast) => (
                                <Card key={broadcast.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow group relative">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => dismissBroadcast(broadcast.id)}
                                            title="Dismiss notification"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardHeader className="bg-muted/10 pb-3 pr-10">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl text-primary">
                                                {broadcast.title}
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground flex items-center bg-background border px-2 py-1 rounded-full shadow-sm">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {format(new Date(broadcast.created_at), 'MMM d, yyyy h:mm a')}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
