import { useEffect } from 'react';
import { toast } from 'sonner';
import { Megaphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function GlobalBroadcastListener() {
    const location = useLocation();

    // Poll for new broadcasts every 5 seconds (near real-time)
    useEffect(() => {
        const checkForBroadcasts = async () => {
            // Don't show toasts on the notifications page itself
            // Don't show toasts on the notifications page itself or admin routes
            if (location.pathname === '/notifications' || location.pathname.startsWith('/admin')) return;

            try {
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/settings/broadcasts';
                const response = await fetch(apiUrl);
                if (!response.ok) return;

                const broadcasts = await response.json();
                if (!broadcasts || broadcasts.length === 0) return;

                // Check local storage for seen broadcasts
                const seenBroadcasts = JSON.parse(localStorage.getItem('seenBroadcasts') || '[]');

                // Find new broadcasts
                const newBroadcasts = broadcasts.filter((b: any) => !seenBroadcasts.includes(b.id || b._id));

                if (newBroadcasts.length > 0) {
                    const latest = newBroadcasts[0];

                    toast(latest.title, {
                        description: latest.message,
                        icon: <Megaphone className="h-4 w-4 text-primary" />,
                        duration: Infinity,
                        action: {
                            label: "View",
                            onClick: () => window.location.href = '/notifications'
                        }
                    });

                    // Mark as seen
                    const updatedSeen = [...seenBroadcasts, ...newBroadcasts.map((b: any) => b.id || b._id)];
                    localStorage.setItem('seenBroadcasts', JSON.stringify(updatedSeen));

                    // Play notification sound
                    try {
                        const audio = new Audio('/notification.mp3');
                        audio.volume = 0.5;
                        audio.play().catch(() => { });
                    } catch (e) {
                        // Ignore audio errors
                    }
                }
            } catch (error) {
                console.error('Error fetching broadcasts:', error);
            }
        };

        // Initial check
        checkForBroadcasts();

        // Set interval
        const interval = setInterval(checkForBroadcasts, 5000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    return null;
}
