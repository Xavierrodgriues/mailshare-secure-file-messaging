import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Broadcast } from '@/hooks/useBroadcasts';

export function GlobalBroadcastListener() {
    const { user } = useAuth();

    const CELEBRATED_KEY = 'mailshare_celebrated_broadcasts';

    useEffect(() => {
        if (!user) return;

        // Check for missed broadcasts on mount/login
        const checkMissedBroadcasts = async () => {
            const { data } = await supabase
                .from('broadcasts')
                .select('id')
                .order('created_at', { ascending: false }); // Latest first

            if (data && data.length > 0) {
                const celebrated = JSON.parse(localStorage.getItem(`${CELEBRATED_KEY}_${user.id}`) || '[]');
                const dismissed = JSON.parse(localStorage.getItem(`mailshare_dismissed_broadcasts_${user.id}`) || '[]');

                // Find any broadcast that is NOT celebrated AND NOT dismissed
                const hasUnseen = data.some(b => !celebrated.includes(b.id) && !dismissed.includes(b.id));

                if (hasUnseen) {
                    // Trigger confetti
                    triggerConfetti();

                    // Mark all current IDs as celebrated so we don't re-trigger on refresh
                    const allIds = data.map(b => b.id);
                    // Merge with existing to keep history if needed, though for this logic just current is fine
                    // better to just add the ones we found to the list
                    const newCelebrated = Array.from(new Set([...celebrated, ...allIds]));
                    localStorage.setItem(`${CELEBRATED_KEY}_${user.id}`, JSON.stringify(newCelebrated));
                }
            }
        };

        checkMissedBroadcasts();

        const channel = supabase
            .channel('global-broadcasts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcasts' }, (payload) => {
                const newBroadcast = payload.new as Broadcast;

                // Mark this specific one as celebrated immediately
                const celebrated = JSON.parse(localStorage.getItem(`${CELEBRATED_KEY}_${user.id}`) || '[]');
                if (!celebrated.includes(newBroadcast.id)) {
                    localStorage.setItem(`${CELEBRATED_KEY}_${user.id}`, JSON.stringify([...celebrated, newBroadcast.id]));

                    // Show confetti only if tab is visible
                    if (document.visibilityState === 'visible') {
                        triggerConfetti();
                    }

                    // Show toast
                    toast.info('New System Announcement!', {
                        description: newBroadcast.title,
                        duration: 5000,
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    return null; // This component doesn't render anything visually
}
