import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Broadcast {
    id: string;
    title: string;
    message: string;
    created_at: string;
    created_by: string;
}

const DISMISSED_KEY = 'mailshare_dismissed_broadcasts';

export function useBroadcasts() {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBroadcasts();

        // Optional: Real-time subscription could be added here
        const channel = supabase
            .channel('public:broadcasts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
                const newBroadcast = payload.new as Broadcast;
                setBroadcasts(prev => [newBroadcast, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchBroadcasts = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('broadcasts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            let dismissedIds: string[] = [];
            if (user) {
                const stored = localStorage.getItem(`${DISMISSED_KEY}_${user.id}`);
                if (stored) {
                    dismissedIds = JSON.parse(stored);
                }
            }

            const visibleBroadcasts = (data || []).filter(b => !dismissedIds.includes(b.id));
            setBroadcasts(visibleBroadcasts);
        } catch (error) {
            console.error('Error fetching broadcasts:', error);
            // toast.error('Failed to load notifications'); // Suppress to avoid annoyance on load if empty
        } finally {
            setIsLoading(false);
        }
    };

    const dismissBroadcast = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const key = `${DISMISSED_KEY}_${user.id}`;
        const stored = localStorage.getItem(key);
        let dismissedIds: string[] = stored ? JSON.parse(stored) : [];

        if (!dismissedIds.includes(id)) {
            dismissedIds.push(id);
            localStorage.setItem(key, JSON.stringify(dismissedIds));
            setBroadcasts(prev => prev.filter(b => b.id !== id));
            toast.success('Notification dismissed');
        }
    };

    return { broadcasts, isLoading, refresh: fetchBroadcasts, dismissBroadcast };
}
