import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';
import { triggerSimpleConfetti } from '@/lib/confetti';

export function GlobalMessageListener() {
    const { user } = useAuth();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const originalTitle = useRef<string>(document.title);

    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.5;
        originalTitle.current = document.title;

        // Unlock audio context on first user interaction
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                }).catch((e) => console.log("Audio unlock failed (harmless if already unlocked)", e));
            }
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('global-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `to_user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newMessage = payload.new;

                    // 1. Play sound
                    try {
                        audioRef.current?.play().catch((e) => console.error("Audio play failed", e));
                    } catch (e) {
                        console.error("Audio error", e);
                    }

                    // 2. Browser Tab Notification (Title)
                    if (document.hidden) {
                        document.title = "(1) New Message! - MailShare";
                    }

                    // 3. Toast Notification
                    toast("New Message Received", {
                        description: newMessage.subject || "No Subject",
                        icon: <Mail className="h-4 w-4 text-primary" />,
                        action: {
                            label: "View",
                            onClick: () => window.location.href = `/` // Redirect to inbox/home
                        }
                    });

                    // 4. System Notification
                    if (Notification.permission === "granted") {
                        try {
                            const n = new Notification("New Message - MailShare", {
                                body: newMessage.subject || "You have a new message.",
                                icon: "/favicon.ico",
                                // @ts-ignore - image is supported in some browsers (Chrome) but not in standard types
                                image: "/yuvii-logo.jpeg",
                                requireInteraction: true,
                                silent: true,
                                tag: 'new-message'
                            });
                            n.onclick = () => {
                                window.focus();
                                window.location.href = '/';
                                n.close();
                            };
                        } catch (e) {
                            console.error("System notification failed", e);
                        }
                    }
                }
            )
            .subscribe();

        // Request permission on mount if not denied
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                document.title = "MailShare"; // Reset to default App title
                // Trigger confetti when returning to the tab
                triggerSimpleConfetti();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [user]);

    return null;
}
