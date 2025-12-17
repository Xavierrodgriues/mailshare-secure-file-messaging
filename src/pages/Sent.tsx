import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageList } from '@/components/mail/MessageList';
import { MessageThread } from '@/components/mail/MessageThread';
import { useSentMessages, Message } from '@/hooks/useMessages';
import { Loader2, Send } from 'lucide-react';
import { groupSentMessages } from '@/lib/messageGrouping';
import { useSearch } from '@/contexts/SearchContext';

export default function SentPage() {
  const { data: messages, isLoading } = useSentMessages();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const { searchQuery, setShowSearch } = useSearch();

  // Show search bar when component mounts, hide when unmounts
  useEffect(() => {
    setShowSearch(true);
    return () => setShowSearch(false);
  }, [setShowSearch]);

  // Filter messages based on search query before grouping
  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!searchQuery.trim()) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter((message) => {
      const subject = message.subject?.toLowerCase() || '';
      const body = message.body?.toLowerCase() || '';
      const recipientName = message.to_profile?.full_name?.toLowerCase() || '';

      return subject.includes(query) || body.includes(query) || recipientName.includes(query);
    });
  }, [messages, searchQuery]);

  const groupedMessages = useMemo(() => {
    return groupSentMessages(filteredMessages || []);
  }, [filteredMessages]);

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
      <div className="flex h-full">
        {/* Message List */}
        <div
          className={cn(
            "w-full md:w-96 border-r border-border overflow-auto h-full bg-background/50",
            selectedMessageId ? "hidden md:block" : "block bg-background"
          )}
        >
          <div className="p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <h1 className="font-display font-semibold text-lg">Sent</h1>
            </div>
          </div>
          <MessageList
            messages={groupedMessages}
            selectedId={selectedMessageId ?? undefined}
            onSelect={handleSelectMessage}
            showSender={false}
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
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
