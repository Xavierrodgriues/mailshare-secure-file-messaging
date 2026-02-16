import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadCount() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['unread-count', user?.id],
        queryFn: async () => {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('to_user_id', user!.id)
                .eq('is_read', false)
                .eq('is_deleted_receiver', false);

            if (error) {
                console.error('Error fetching unread count:', error);
                return 0;
            }

            return count || 0;
        },
        enabled: !!user,
        // Refetch often enough to feel responsive but not spam the server
        refetchInterval: 30000,
        staleTime: 10000,
    });
}
