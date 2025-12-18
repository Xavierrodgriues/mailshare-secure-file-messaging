import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageList } from '@/components/mail/MessageList';
import { MessageThread } from '@/components/mail/MessageThread';
import { useInboxMessages, Message } from '@/hooks/useMessages';
import { Loader2, Inbox } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function InboxPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInboxMessages();

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const { searchQuery, setShowSearch } = useSearch();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Flatten pages into a single array of messages
  const allMessages = useMemo(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  // Show search bar when component mounts, hide when unmounts
  useEffect(() => {
    setShowSearch(true);
    return () => setShowSearch(false);
  }, [setShowSearch]);

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px', // Load before reaching the exact bottom
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!allMessages) return [];
    if (!searchQuery.trim()) return allMessages;

    const query = searchQuery.toLowerCase();
    return allMessages.filter((message) => {
      const subject = message.subject?.toLowerCase() || '';
      const body = message.body?.toLowerCase() || '';
      const senderName = message.from_profile?.full_name?.toLowerCase() || '';

      return subject.includes(query) || body.includes(query) || senderName.includes(query);
    });
  }, [allMessages, searchQuery]);

  const handleSelectMessage = (message: Message) => {
    setSelectedMessageId(message.id);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full">
          <div className="w-full md:w-96 border-r border-border p-4 space-y-4">
            <Skeleton className="h-8 w-3/4 mb-6" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
          <div className="hidden md:flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-full overflow-hidden">
        {/* Message List */}
        <div
          className={cn(
            "w-full md:w-96 border-r border-border overflow-auto h-full bg-background/50",
            selectedMessageId ? "hidden md:block" : "block bg-background"
          )}
        >
          <div className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              <h1 className="font-display font-semibold text-lg">Inbox</h1>
              {filteredMessages && filteredMessages.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({filteredMessages.filter(m => !m.is_read).length} unread)
                </span>
              )}
            </div>
          </div>

          <MessageList
            messages={filteredMessages || []}
            selectedId={selectedMessageId ?? undefined}
            onSelect={handleSelectMessage}
            showSender={true}
          />

          {/* Infinite Scroll Sentinel */}
          {!searchQuery.trim() && (
            <div className="p-4 flex justify-center w-full" ref={observerTarget}>
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              )}
              {!hasNextPage && allMessages.length > 0 && (
                <span className="text-sm text-muted-foreground">No more messages</span>
              )}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div
          className={cn(
            "flex-1 flex-col h-full overflow-hidden bg-background",
            selectedMessageId ? "flex" : "hidden md:flex"
          )}
        >
          {selectedMessageId ? (
            <MessageThread
              messageId={selectedMessageId}
              onBack={() => setSelectedMessageId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
