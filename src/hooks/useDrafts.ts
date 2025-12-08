import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export interface Draft {
    id: string;
    toUserId?: string;
    toUserEmail?: string;
    toUserName?: string;
    subject: string;
    body: string;
    updatedAt: string;
}

const STORAGE_KEY = 'mailshare_drafts';

export function useDrafts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const draftsQuery = useQuery({
        queryKey: ['drafts', user?.id],
        queryFn: async () => {
            if (!user) return [];
            try {
                const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
                return stored ? JSON.parse(stored) as Draft[] : [];
            } catch (error) {
                console.error('Failed to load drafts', error);
                return [];
            }
        },
        enabled: !!user,
    });

    const saveDraftMutation = useMutation({
        mutationFn: async (draft: Omit<Draft, 'updatedAt'> | Draft) => {
            if (!user) throw new Error('No user');

            const currentDrafts = draftsQuery.data || [];
            const newDraft = {
                ...draft,
                updatedAt: new Date().toISOString(),
                id: draft.id || uuidv4(),
            };

            const existingIndex = currentDrafts.findIndex((d) => d.id === newDraft.id);
            let nextDrafts;
            if (existingIndex >= 0) {
                nextDrafts = [...currentDrafts];
                nextDrafts[existingIndex] = newDraft;
            } else {
                nextDrafts = [newDraft, ...currentDrafts];
            }

            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(nextDrafts));
            return newDraft.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drafts'] });
        },
    });

    const deleteDraftMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error('No user');
            const currentDrafts = draftsQuery.data || [];
            const nextDrafts = currentDrafts.filter((d) => d.id !== id);
            localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(nextDrafts));
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
