import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface Broadcast {
    _id: string; // MongoDB uses _id
    id?: string; // Fallback
    title: string;
    message: string;
    createdAt: string; // MongoDB uses createdAt
    adminId: string;
}

export function useBroadcasts() {
    const queryClient = useQueryClient();

    // Query for server data
    const { data: broadcasts = [], isLoading } = useQuery({
        queryKey: ['broadcasts'],
        queryFn: async () => {
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/settings/broadcasts';
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch broadcasts');

            const data = await response.json();

            // Filter out dismissed
            // Matching the key used in Notifications.tsx
            const dismissed = JSON.parse(localStorage.getItem('dismissedBroadcasts') || '[]');

            return (data || []).filter((b: any) => {
                // Support both MongoDB _id and generic id
                const id = b._id || b.id;
                return !dismissed.includes(id);
            });
        },
        staleTime: 1000 * 60 * 5, // 5 minutes default
    });

    // Listen for updates from other components
    useEffect(() => {
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
        };

        window.addEventListener('broadcasts-updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        return () => {
            window.removeEventListener('broadcasts-updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [queryClient]);

    return {
        broadcasts,
        isLoading,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['broadcasts'] }),
    };
}

