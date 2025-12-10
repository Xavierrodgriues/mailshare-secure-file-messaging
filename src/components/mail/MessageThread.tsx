
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationInfinite, useMarkMessagesAsRead, useDeleteMessage, Message } from '@/hooks/useMessages';
import { useDownloadFile } from '@/hooks/useAttachments';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Download, Trash2, Reply, Paperclip, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ComposeDialog } from './ComposeDialog';
import { formatFileSize } from '@/lib/utils';

interface MessageThreadProps {
    messageId: string;
    onBack?: () => void;
}

export function MessageThread({ messageId, onBack }: MessageThreadProps) {
    const { user } = useAuth();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        baseSubject,
        otherUserId,
        metadataLoading
    } = useConversationInfinite(messageId);

    const markMessagesAsRead = useMarkMessagesAsRead();
    const deleteMessage = useDeleteMessage();
    const downloadFile = useDownloadFile();

    const [replyOpen, setReplyOpen] = useState(false);
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const lastScrollHeightRef = useRef<number>(0);
    const shouldScrollToBottomRef = useRef<boolean>(true);

    // Flatten pages into a single array and sort ASC (oldest to newest) for display
    const messages = data?.pages.flatMap(page => page) || [];
    // We get them DESC (newest first) from pages, so we need to reverse them for display?
    // The hook returns DESC (newest first). 
    // Example: Page 1: [Msg 100, Msg 99...], Page 2: [Msg 80, Msg 79...]
    // flatMap gives [100, 99, ..., 80, 79...]
    // We want display: 1 (oldest) -> 100 (newest).
    // So we need to sort ascending.
    const sortedMessages = [...messages].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Mark unread messages as read
    useEffect(() => {
        if (sortedMessages.length > 0) {
            const unreadIds = sortedMessages
                .filter(m => !m.is_read && m.to_user_id === user?.id)
                .map(m => m.id);

            if (unreadIds.length > 0) {
                markMessagesAsRead.mutate(unreadIds);
            }
        }
    }, [messages.length, user?.id]); // Depend on messages.length to re-run when new messages arrive

    // Handle scroll preservation and initial scroll
    useEffect(() => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        if (shouldScrollToBottomRef.current) {
            viewport.scrollTop = viewport.scrollHeight;
            shouldScrollToBottomRef.current = false;
        } else if (lastScrollHeightRef.current > 0) {
            // If we loaded more messages (previous pages), we want to maintain relative position
            // The new content is added at the TOP.
            // New scrollHeight - old scrollHeight = amount of new content added at top.
            // We adding this to scrollTop keeps the view stable.
            const heightDifference = viewport.scrollHeight - lastScrollHeightRef.current;
            if (heightDifference > 0) {
                viewport.scrollTop += heightDifference;
            }
            lastScrollHeightRef.current = 0;
        }
    }, [messages.length, isFetchingNextPage]); // Run when messages change

    const handleScroll = () => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        // If user scrolls near top (e.g. within 100px), fetch next page
        if (viewport.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
            lastScrollHeightRef.current = viewport.scrollHeight;
            fetchNextPage();
        }
    };

    if (status === 'pending' || metadataLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (status === 'error' || !baseSubject) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>Failed to load conversation</p>
            </div>
        );
    }

    // Determine other user details
    const otherUser = sortedMessages.find(m => m.from_user_id !== user?.id)?.from_profile ||
        sortedMessages.find(m => m.to_user_id !== user?.id)?.to_profile;


    const handleDownload = async (filePath: string, fileName: string) => {
        try {
            await downloadFile(filePath, fileName);
            toast.success('Download started');
        } catch (error) {
            toast.error('Failed to download file');
        }
    };

    const handleDelete = async (message: Message) => {
        try {
            await deleteMessage.mutateAsync({
                messageId: message.id,
                isSender: message.from_user_id === user?.id,
            });
            toast.success('Message deleted');
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    return (
        <>
            <div className="h-full flex flex-col bg-background animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden mr-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <h2 className="font-display font-semibold text-lg truncate flex-1">
                            {baseSubject || '(No subject)'}
                        </h2>
                        <span className="text-xs text-muted-foreground whitespace-nowrap px-2 rounded-full bg-muted">
                            {sortedMessages.length} visible
                        </span>
                    </div>
                </div>

                {/* Thread Content */}
                <div
                    ref={scrollViewportRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto p-4 space-y-6 no-scrollbar"
                >
                    {isFetchingNextPage && (
                        <div className="flex justify-center py-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                        </div>
                    )}

                    {sortedMessages.map((msg, index) => {
                        const isMe = msg.from_user_id === user?.id;
                        const senderName = msg.from_profile?.full_name || 'Unknown';
                        const initials = senderName.slice(0, 2).toUpperCase();

                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-4 group ${
                                    // Optional: distinct styling for read/unread or focused
                                    ''
                                    }`}
                            >
                                <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
                                    <AvatarFallback className={isMe ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={`flex-1 min-w-0 border rounded-lg p-4 ${isMe ? 'bg-muted/30' : 'bg-card'}`}>
                                    {/* Message Header */}
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="space-y-0.5">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="font-semibold text-sm">{senderName}</span>
                                                <span className="text-xs text-muted-foreground">&lt;{msg.from_profile?.email}&gt;</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {format(new Date(msg.created_at), 'PPP p')}
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(msg)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground mb-4">
                                        {msg.body || '(No content)'}
                                    </div>

                                    {/* Attachments */}
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="pt-3 border-t border-border/50">
                                            <div className="flex flex-wrap gap-2">
                                                {msg.attachments.map((attachment) => (
                                                    <Button
                                                        key={attachment.id}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-auto py-2 px-3 gap-2 max-w-full"
                                                        onClick={() => handleDownload(attachment.file_path, attachment.file_name)}
                                                    >
                                                        <Paperclip className="h-3.5 w-3.5" />
                                                        <div className="flex flex-col items-start truncate text-xs">
                                                            <span className="truncate max-w-[150px]">{attachment.file_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{formatFileSize(attachment.file_size)}</span>
                                                        </div>
                                                        <Download className="h-3.5 w-3.5 ml-1 opacity-50" />
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Anchor for scrolling - effectively replaced by scrollViewportRef logic */}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
                    <Button onClick={() => setReplyOpen(true)} className="w-full sm:w-auto gap-2">
                        <Reply className="h-4 w-4" />
                        Reply
                    </Button>
                </div>
            </div>

            <ComposeDialog
                open={replyOpen}
                onOpenChange={setReplyOpen}
                replyTo={{
                    userId: otherUserId,
                    // If I am the sender of the last message, I reply to the OTHER person.
                    // If I am the receiver of the last message, I reply to the SENDER.
                    // Actually, in a 1-on-1 thread, I always reply to the 'otherUser'.
                    // useConversation gives us `otherUserId` which is the ID of the person I'm talking to.
                    // I need their name and email.
                    name: otherUser?.full_name || 'Unknown',
                    email: otherUser?.email || '',
                    subject: baseSubject,
                }}
            />
        </>
    );
}
