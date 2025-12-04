import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  selectedId?: string;
  onSelect: (message: Message) => void;
  showSender?: boolean;
}

export function MessageList({ messages, selectedId, onSelect, showSender = true }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg font-medium">No messages</p>
        <p className="text-sm">Your mailbox is empty</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {messages.map((message) => {
        const displayName = showSender
          ? message.from_profile?.full_name || 'Unknown'
          : message.to_profile?.full_name || 'Unknown';
        const isSelected = selectedId === message.id;
        const hasAttachments = (message.attachments?.length ?? 0) > 0;

        return (
          <button
            key={message.id}
            onClick={() => onSelect(message)}
            className={cn(
              "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
              isSelected && "bg-primary/5 border-l-2 border-l-primary",
              !message.is_read && "bg-muted/30"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm truncate",
                    !message.is_read && "font-semibold"
                  )}>
                    {displayName}
                  </span>
                  {hasAttachments && (
                    <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className={cn(
                  "text-sm truncate",
                  !message.is_read ? "font-medium" : "text-muted-foreground"
                )}>
                  {message.subject || '(No subject)'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {message.body?.slice(0, 100) || '(No content)'}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
