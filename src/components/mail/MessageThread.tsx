
import { useEffect, useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConversationInfinite, useMarkMessagesAsRead, useDeleteMessage, Message } from '@/hooks/useMessages';
import { useDownloadFile } from '@/hooks/useAttachments';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Download, Trash2, Reply, Paperclip, ArrowLeft, Loader2, MoreVertical, Pencil, Forward } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ComposeDialog } from './ComposeDialog';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils'; // Assuming cn utility is available or use standard className

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
    const [editAsNewMessage, setEditAsNewMessage] = useState<Message | null>(null);
    const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

    // Scroll refs
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    // Track previous scroll height to maintain position when loading older messages
    const previousScrollHeightRef = useRef<number>(0);
    // Track if we should auto-scroll to bottom (initially or when new message arrives)
    const shouldScrollToBottomRef = useRef<boolean>(true);
    // Track if we are currently handling a "prepend" operation
    const isPrependingRef = useRef<boolean>(false);

    // 1. Memoize flat list of messages
    const rawMessages = useMemo(() => {
        return data?.pages.flatMap(page => page) || [];
    }, [data?.pages]);

    // 2. Memoize sorted messages (ASC for display)
    const sortedMessages = useMemo(() => {
        return [...rawMessages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [rawMessages]);

    // Reset scroll state when switching conversations
    useLayoutEffect(() => {
        shouldScrollToBottomRef.current = true;
        previousScrollHeightRef.current = 0;
        isPrependingRef.current = false;
        setReplyOpen(false); // Also close reply dialog if open
        setEditAsNewMessage(null);
        setForwardMessage(null);
    }, [messageId]);

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
    }, [sortedMessages.length, user?.id]);

    // Scroll Management with useLayoutEffect to prevent flickering
    useLayoutEffect(() => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        // CASE 1: Initial Load or New Message at Bottom
        if (shouldScrollToBottomRef.current) {
            viewport.scrollTop = viewport.scrollHeight;
            // Only turn off auto-scroll if we have actually loaded messages
            if (sortedMessages.length > 0) {
                shouldScrollToBottomRef.current = false;
            }
            return;
        }

        // CASE 2: Loaded Older Messages (Prepend)
        if (isPrependingRef.current && previousScrollHeightRef.current > 0) {
            const newScrollHeight = viewport.scrollHeight;
            const diff = newScrollHeight - previousScrollHeightRef.current;

            // Adjust scroll position to keep user's view stable
            if (diff > 0) {
                viewport.scrollTop += diff;
            }

            isPrependingRef.current = false;
            previousScrollHeightRef.current = 0;
            return;
        }

        // CASE 3: New Message Arrived (Real-time or Sent by user)
        // If user was already near bottom, auto-scroll to new bottom.
        // We can detect this by checking if the previous scroll position + height was near bottom.
        // For simplicity, if we are NOT prepending, and length increased, check bottom proximity.
        // However, since we don't track "previous raw length" in a ref here easily without more state,
        // we can assume if 'shouldScrollToBottomRef' is false, the user might have scrolled up.
        // But for a chat app, usually if you are at the very bottom, you want to stay there.

        const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
        if (isNearBottom) {
            viewport.scrollTop = viewport.scrollHeight;
        }

    }, [sortedMessages, isFetchingNextPage]); // Depend on sortedMessages reference change

    const handleScroll = () => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        // Detect if we need to fetch older messages (scrolled to top)
        if (viewport.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
            // Save current scroll height to restore position after fetch
            previousScrollHeightRef.current = viewport.scrollHeight;
            isPrependingRef.current = true;
            fetchNextPage();
            console.log('Fetching the older messages');
        }

        // Detect if user scrolled away from bottom to disable auto-scroll momentarily if needed
        // (Managed mostly by layout effect logic logic)
    };

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

    // Auto-scroll on send (when sortedMessages grows and we authored the last one, or just force it)
    useEffect(() => {
        if (sortedMessages.length > 0) {
            const lastMsg = sortedMessages[sortedMessages.length - 1];
            if (lastMsg.from_user_id === user?.id) {
                shouldScrollToBottomRef.current = true;
            }
        }
    }, [sortedMessages.length, user?.id]);


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
                    className="flex-1 overflow-auto p-4 space-y-6 no-scrollbar scrolling-touch"
                >
                    {/* Top Loader for Infinite Scroll */}
                    {isFetchingNextPage && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                        </div>
                    )}

                    {sortedMessages.map((msg, index) => {
                        const isMe = msg.from_user_id === user?.id;
                        const senderName = msg.from_profile?.full_name || 'Unknown';
                        const initials = senderName.slice(0, 2).toUpperCase();

                        // Check if previous message was from same sender to group visually if desired
                        // const isSequence = index > 0 && sortedMessages[index-1].from_user_id === msg.from_user_id;

                        return (
                            <div
                                key={msg.id}
                                className={cn("flex gap-4 group transition-opacity duration-200",
                                    // isSequence ? "mt-1" : "mt-4" // Optional spacing
                                )}
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
                                        <div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-accent">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditAsNewMessage(msg)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit as New
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setForwardMessage(msg)}>
                                                        <Forward className="h-4 w-4 mr-2" />
                                                        Forward
                                                    </DropdownMenuItem>
                                                    {/* <DropdownMenuItem onClick={() => handleDelete(msg)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem> */}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                    name: otherUser?.full_name || 'Unknown',
                    email: otherUser?.email || '',
                    subject: baseSubject,
                }}
            />

            {editAsNewMessage && (
                <ComposeDialog
                    open={!!editAsNewMessage}
                    onOpenChange={(open) => {
                        if (!open) setEditAsNewMessage(null);
                    }}
                    mode="edit-as-new"
                    initialData={editAsNewMessage}
                />
            )}

            {forwardMessage && (
                <ComposeDialog
                    open={!!forwardMessage}
                    onOpenChange={(open) => {
                        if (!open) setForwardMessage(null);
                    }}
                    mode="forward"
                    initialData={forwardMessage}
                />
            )}
        </>
    );
}
