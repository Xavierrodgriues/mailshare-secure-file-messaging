import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface Broadcast {
    id: string;
    title: string;
    message: string;
    created_at: string;
    created_by: string;
}

const DISMISSED_KEY = 'mailshare_dismissed_broadcasts';

export function useBroadcasts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Query for server data
    const { data: allBroadcasts = [], isLoading: isLoadingBroadcasts } = useQuery({
        queryKey: ['broadcasts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('broadcasts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Broadcast[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Query for local dismissed state
    const { data: dismissedIds = [] } = useQuery({
        queryKey: ['dismissed_broadcasts', user?.id],
        queryFn: () => {
            if (!user) return [];
            const stored = localStorage.getItem(`${DISMISSED_KEY}_${user.id}`);
            return stored ? JSON.parse(stored) as string[] : [];
        },
        enabled: !!user,
        staleTime: Infinity, // Rely on invalidation
    });

    // Mutation to dismiss
    const { mutate: dismissBroadcast } = useMutation({
        mutationFn: async (id: string) => {
            if (!user) return;
            const key = `${DISMISSED_KEY}_${user.id}`;
            const current = dismissedIds;
            if (!current.includes(id)) {
                const updated = [...current, id];
                localStorage.setItem(key, JSON.stringify(updated));
                return updated;
            }
            return current;
        },
        onSuccess: (updatedIds) => {
            if (updatedIds) {
                queryClient.setQueryData(['dismissed_broadcasts', user?.id], updatedIds);
                toast.success('Notification dismissed');
            }
        },
    });

    // Filter logic
    const broadcasts = allBroadcasts.filter(b => !dismissedIds.includes(b.id));

    return {
        broadcasts,
        isLoading: isLoadingBroadcasts,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['broadcasts'] }),
        dismissBroadcast
    };
}

