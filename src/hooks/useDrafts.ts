import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Draft {
    id: string;
    user_id?: string;
    toUserId?: string;
    toUserEmail?: string;
    toUserName?: string;
    subject: string;
    body: string;
    updatedAt: string;
}

export function useDrafts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const draftsQuery = useQuery({
        queryKey: ['drafts', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('drafts')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Failed to load drafts', error);
                throw error;
            }

            // Map database fields to frontend model
            return (data || []).map(d => ({
                id: d.id,
                toUserId: d.to_user_id,
                toUserEmail: d.to_user_email,
                toUserName: d.to_user_name,
                subject: d.subject,
                body: d.body,
                updatedAt: d.updated_at
            })) as Draft[];
        },
        enabled: !!user,
    });

    const saveDraftMutation = useMutation({
        mutationFn: async (draft: Partial<Draft> & { id?: string }) => {
            if (!user) throw new Error('No user');

            const draftData = {
                user_id: user.id,
                to_user_id: draft.toUserId ?? null,
                to_user_email: draft.toUserEmail ?? null,
                to_user_name: draft.toUserName ?? null,
                subject: draft.subject ?? '',
                body: draft.body ?? '',
                updated_at: new Date().toISOString(),
            };

            let data, error;

            if (draft.id && draft.id.length > 10) {
                const result = await supabase
                    .from('drafts')
                    .upsert({ ...draftData, id: draft.id })
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            } else {
                const result = await supabase
                    .from('drafts')
                    .insert(draftData)
                    .select()
                    .single();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;
            return data.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drafts'] });
        },
    });

    const deleteDraftMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error('No user');
            const { error } = await supabase
                .from('drafts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drafts'] });
        },
    });

    return {
        drafts: draftsQuery.data || [],
        isLoading: draftsQuery.isLoading,
        saveDraft: saveDraftMutation.mutate,
        saveDraftAsync: saveDraftMutation.mutateAsync,
        deleteDraft: deleteDraftMutation.mutate,
        getDraft: (id: string) => (draftsQuery.data || []).find((d) => d.id === id),
    };
}
