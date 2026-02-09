import { Message, useMarkAsRead, useDeleteMessage } from '@/hooks/useMessages';
import { useDownloadFile, useGetFileUrl } from '@/hooks/useAttachments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Download, Trash2, Reply, Paperclip, ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ComposeDialog } from './ComposeDialog';
import { formatFileSize, cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface MessageDetailProps {
  message: Message;
  onBack?: () => void;
}

export function MessageDetail({ message, onBack }: MessageDetailProps) {
  const { user } = useAuth();
  const markAsRead = useMarkAsRead();
  const deleteMessage = useDeleteMessage();
  const downloadFile = useDownloadFile();
  const getFileUrl = useGetFileUrl();
  const [replyOpen, setReplyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const senderName = message.from_profile?.full_name || 'Unknown';
  const senderEmail = message.from_profile?.email || '';
  const recipientName = message.to_profile?.full_name || 'Unknown';
  const recipientEmail = message.to_profile?.email || '';
  const isSender = message.from_user_id === user?.id;

  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (!message.is_read && message.to_user_id === user?.id) {
      markAsRead.mutate(message.id);
    }
  }, [message.id, message.is_read, message.to_user_id, user?.id]);

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync({
        messageId: message.id,
        isSender,
      });
      toast.success('Message moved to trash');
      onBack?.();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      toast.promise(downloadFile(filePath, fileName), {
        loading: 'Downloading...',
        success: 'Download completed',
        error: 'Failed to download file',
      });
    } catch (error) {
      // Error handled by toast promise
    }
  };

  const handleAttachmentClick = async (filePath: string, fileName: string, fileType: string | null) => {
    // Check if it's an image
    const isImage = fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

    if (isImage) {
      try {
        setIsPreviewLoading(true);
        setPreviewFileName(fileName);
        setPreviewOpen(true); // Open immediately to show loader if needed
        const url = await getFileUrl(filePath);
        setPreviewUrl(url);
      } catch (error) {
        toast.error('Failed to load preview');
        setPreviewOpen(false); // Close if fails
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      // For non-images (PDF, Docs, etc.), handle as download
      handleDownload(filePath, fileName);
    }
  };

  return (
    <>
      <div className="h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="font-display font-semibold text-lg truncate">
              {message.subject || '(No subject)'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setReplyOpen(true)}>
              <Reply className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Sender Info */}
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{senderName}</span>
                <span className="text-sm text-muted-foreground">&lt;{senderEmail}&gt;</span>
              </div>
              <div className="text-sm text-muted-foreground">
                to{' '}
                {message.recipients && message.recipients.length > 0
                  ? message.recipients.map((r, index) => (
                    <span key={index}>
                      {r.name} &lt;{r.email}&gt;
                      {index < message.recipients!.length - 1 && ', '}
                    </span>
                  ))
                  : `${recipientName} <${recipientEmail}>`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(message.created_at), 'PPpp')}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {message.body || '(No content)'}
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {message.attachments.length} Attachment{message.attachments.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid gap-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                    onClick={() => handleAttachmentClick(attachment.file_path, attachment.file_name, attachment.file_type)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Paperclip className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.file_size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(attachment.file_path, attachment.file_name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ComposeDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        replyTo={{
          userId: message.from_user_id,
          name: senderName,
          email: senderEmail,
          subject: message.subject,
        }}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full h-auto max-h-[90vh] p-0 overflow-hidden flex flex-col bg-transparent border-none shadow-none sm:bg-background sm:border sm:shadow-lg">
          <VisuallyHidden>
            <DialogTitle>Attachment Preview</DialogTitle>
            <DialogDescription>Previewing {previewFileName}</DialogDescription>
          </VisuallyHidden>

          <DialogHeader className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between border-b border-border/40 sm:static">
            <h3 className="text-lg font-semibold truncate flex-1 mr-4">{previewFileName}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(message.attachments?.find(a => a.file_name === previewFileName)?.file_path || '', previewFileName)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-auto flex items-center justify-center bg-black/5 min-h-[300px] p-4">
            {isPreviewLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt={previewFileName}
                className="max-w-full max-h-[80vh] object-contain rounded-md shadow-sm"
              />
            ) : (
              <div className="text-destructive">Failed to load preview</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
