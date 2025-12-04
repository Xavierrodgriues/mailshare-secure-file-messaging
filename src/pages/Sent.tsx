import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageList } from '@/components/mail/MessageList';
import { MessageDetail } from '@/components/mail/MessageDetail';
import { useSentMessages, Message, useMessage } from '@/hooks/useMessages';
import { Loader2, Send } from 'lucide-react';

export default function SentPage() {
  const { data: messages, isLoading } = useSentMessages();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const { data: selectedMessage } = useMessage(selectedMessageId ?? undefined);

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
              <Send className="h-5 w-5 text-primary" />
              <h1 className="font-display font-semibold text-lg">Sent</h1>
            </div>
          </div>
          <MessageList
            messages={messages || []}
            selectedId={selectedMessageId ?? undefined}
            onSelect={handleSelectMessage}
            showSender={false}
          />
        </div>

        {/* Message Detail */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedMessage ? (
            <MessageDetail
              message={selectedMessage}
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
