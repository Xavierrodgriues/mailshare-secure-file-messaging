import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useSendMessage } from '@/hooks/useMessages';
import { toast } from 'sonner';
import { Send, Paperclip, X, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    userId: string;
    name: string;
    email: string;
    subject: string;
  };
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function ComposeDialog({ open, onOpenChange, replyTo }: ComposeDialogProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: profiles = [] } = useProfiles(searchTerm);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (replyTo && open) {
      setSelectedUser({
        id: replyTo.userId,
        full_name: replyTo.name,
        email: replyTo.email,
        avatar_url: null,
      });
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
    }
  }, [replyTo, open]);

  const handleClose = () => {
    setSelectedUser(null);
    setSubject('');
    setBody('');
    setAttachments([]);
    setSearchTerm('');
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds 25MB limit`);
        return;
      }
    }

    setAttachments((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error('Please select a recipient');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        toUserId: selectedUser.id,
        subject,
        body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success('Message sent!');
      handleClose();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[640px] p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="font-display">New Message</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* To Field */}
          <div className="space-y-2">
            <Label>To</Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedUser ? (
                    <span>
                      {selectedUser.full_name}{' '}
                      <span className="text-muted-foreground">&lt;{selectedUser.email}&gt;</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select recipient...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[550px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search users..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {profiles.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={profile.email}
                          onSelect={() => {
                            setSelectedUser(profile);
                            setSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUser?.id === profile.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{profile.full_name}</span>
                            <span className="text-xs text-muted-foreground">{profile.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="Enter subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message..."
              className="min-h-[200px] resize-none"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div>
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button variant="ghost" size="sm" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach Files
              </label>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sendMessage.isPending}>
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
