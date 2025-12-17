import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageList } from '@/components/mail/MessageList';
import { MessageThread } from '@/components/mail/MessageThread';
import { useInboxMessages, Message } from '@/hooks/useMessages';
import { Loader2, Inbox } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

export default function InboxPage() {
  const { data: messages, isLoading } = useInboxMessages();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const { searchQuery, setShowSearch } = useSearch();

  // Show search bar when component mounts, hide when unmounts
  useEffect(() => {
    setShowSearch(true);
    return () => setShowSearch(false);
  }, [setShowSearch]);

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!searchQuery.trim()) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter((message) => {
      const subject = message.subject?.toLowerCase() || '';
      const body = message.body?.toLowerCase() || '';
      const senderName = message.from_profile?.full_name?.toLowerCase() || '';

      return subject.includes(query) || body.includes(query) || senderName.includes(query);
    });
  }, [messages, searchQuery]);

  const handleSelectMessage = (message: Message) => {
    setSelectedMessageId(message.id);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
