import { Message } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip } from 'lucide-react';
import { GroupedMessage } from '@/lib/messageGrouping';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageListProps {
  messages: (Message | GroupedMessage)[];
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

  const getRecipientDisplay = (msg: GroupedMessage) => {
    if (showSender) return msg.from_profile?.full_name || 'Unknown';

    // It's a Sent message, show recipients
    if (msg.isGrouped && msg.recipients && msg.recipients.length > 1) {
      const names = msg.recipients.map(r => r.name.split(' ')[0]); // First names only for compactness? Gmail uses full names usually but truncates.
      // Requirements: "Use recipient full names" but also "Mobile: Name +N".
      // Let's use first names for comma list to fit more, or full names if few.
      // Requirement 2: "To: Pravin, Jennifer"

      const firstNames = msg.recipients.map(r => r.name);

      if (firstNames.length === 2) {
        return `To: ${firstNames.join(', ')}`;
      }

      return `To: ${firstNames.slice(0, 2).join(', ')} +${firstNames.length - 2} others`;
    }

    return `To: ${msg.to_profile?.full_name || 'Unknown'}`;
  };

  return (
    <div className="divide-y divide-border">
      {messages.map((message) => {
        const groupedMsg = message as GroupedMessage;
        const displayName = getRecipientDisplay(groupedMsg);

        // Tooltip content: All full names
        const tooltipText = groupedMsg.recipients?.map(r => r.name).join(', ') || displayName;

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
                  <TooltipProvider delayDuration={500}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn(
                          "text-sm truncate max-w-[200px] block", // explicit block/truncate for tooltip trigger
                          !message.is_read && "font-semibold"
                        )}>
                          {displayName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

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
                  {message.body?.replace(/<[^>]*>?/gm, '').slice(0, 100) || '(No content)'}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
