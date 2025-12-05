import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageList } from '@/components/mail/MessageList';
import { MessageThread } from '@/components/mail/MessageThread';
import { useInboxMessages, Message } from '@/hooks/useMessages';
import { Loader2, Inbox } from 'lucide-react';

export default function InboxPage() {
  const { data: messages, isLoading } = useInboxMessages();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

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
        <div className="w-full md:w-96 border-r border-border overflow-auto">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              <h1 className="font-display font-semibold text-lg">Inbox</h1>
              {messages && messages.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({messages.filter(m => !m.is_read).length} unread)
                </span>
              )}
            </div>
          </div>
          <MessageList
            messages={messages || []}
            selectedId={selectedMessageId ?? undefined}
            onSelect={handleSelectMessage}
            showSender={true}
          />
        </div>

        {/* Message Detail */}
        <div className="hidden md:flex flex-1 flex-col">
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
