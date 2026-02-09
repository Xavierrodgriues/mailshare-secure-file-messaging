import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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
import { useDebounce } from '@/hooks/useDebounce';
import { useSendMessage, Message, Attachment } from '@/hooks/useMessages';
import { toast } from 'sonner';
import { Send, Paperclip, X, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    userId: string;
    name: string;
    email: string;
    subject: string;
  };
  draftId?: string;
  mode?: 'compose' | 'edit-as-new' | 'forward';
  initialData?: Message;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

import { useDrafts } from '@/hooks/useDrafts';

export function ComposeDialog({ open, onOpenChange, replyTo, draftId, mode = 'compose', initialData }: ComposeDialogProps) {
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false);
  const [totalUserCount, setTotalUserCount] = useState<number>(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: profiles = [], isLoading: isSearching } = useProfiles(
    debouncedSearchTerm,
    selectedUsers.map((u) => u.id)
  );

  const sendMessage = useSendMessage();
  const { saveDraftAsync, deleteDraft, getDraft } = useDrafts();
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Fetch total user count
  useEffect(() => {
    if (open) {
      const fetchCount = async () => {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { count: exactCount } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .neq('id', user.id);
            if (exactCount !== null) setTotalUserCount(exactCount);
          }
        }
      };
      fetchCount();
    }
  }, [open]);

  // Load draft if provided
  useEffect(() => {
    if (draftId && open) {
      const draft = getDraft(draftId);
      if (draft) {
        setSubject(draft.subject);
        setBody(draft.body);
        setCurrentDraftId(draft.id);
        if (draft.toUserId && draft.toUserEmail && draft.toUserName) {
          // TODO: Drafts structure assumes single user currently. 
          // For now, we load it as a single selected user.
          // Future task: Update drafts to support multiple recipients.
          setSelectedUsers([{
            id: draft.toUserId,
            full_name: draft.toUserName,
            email: draft.toUserEmail,
            avatar_url: null,
          } as Profile]);
        }
      }
    }
  }, [draftId, open]);

  // Handle Reply setup
  useEffect(() => {
    if (replyTo && open && !draftId && mode === 'compose') {
      setSelectedUsers([{
        id: replyTo.userId,
        full_name: replyTo.name,
        email: replyTo.email,
        avatar_url: null,
      } as Profile]);
      setSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
    }
  }, [replyTo, open, draftId, mode]);

  // Handle Edit as New setup
  useEffect(() => {
    if (mode === 'edit-as-new' && initialData && open) {
      setSubject(initialData.subject.startsWith('Edit:') ? initialData.subject : `Edit: ${initialData.subject}`);
      setBody(initialData.body);

      // Pre-fill To field
      // Logic: If I am the sender, use the original recipients.
      // If I received it, use the original recipients? Or just the sender?
      // "Edit as New" usually implies: take this message content and start a new draft.
      // If I sent it effectively I want to send TO the same people.
      // If I received it, I probably want to send it TO someone else or back to sender?
      // Requirement says: "To -> same recipients as the original message"
      // If I received it, "recipients" includes ME. I probably don't want to send to myself.
      // But let's stick to the message's `to_profile` or `to_user_id`.
      // The message object has `to_profile`.
      if (initialData.to_profile && initialData.to_user_id) {
        setSelectedUsers([{
          id: initialData.to_user_id,
          full_name: initialData.to_profile.full_name,
          email: initialData.to_profile.email,
          avatar_url: null,
        } as Profile]);
      } else {
        // Fallback or maybe handle multiple recipients if the message data supported it (currently schema is 1:1)
        setSelectedUsers([]);
      }

      // Handle attachments
      if (initialData.attachments) {
        setExistingAttachments(initialData.attachments);
      }
    }

    if (mode === 'forward' && initialData && open) {
      setSubject(initialData.subject.startsWith('Fwd:') ? initialData.subject : `Fwd: ${initialData.subject}`);

      const forwardedHeader = `

---------- Forwarded message ---------
From: ${initialData.from_profile?.full_name || 'Unknown'} <${initialData.from_profile?.email || 'unknown@example.com'}>
Date: ${new Date(initialData.created_at).toLocaleString()}
Subject: ${initialData.subject}
To: ${initialData.to_profile?.full_name || 'Unknown'} <${initialData.to_profile?.email || 'unknown@example.com'}>

`;
      setBody(forwardedHeader + (initialData.body || ''));

      // Clear recipients for forward
      setSelectedUsers([]);

      // Handle attachments
      if (initialData.attachments) {
        setExistingAttachments(initialData.attachments);
      }
    }
  }, [mode, initialData, open]);

  // Auto-save draft
  useEffect(() => {
    if (!open) return;

    // Don't save if empty and no previous draft ID
    if (!subject && !body && selectedUsers.length === 0 && !currentDraftId) return;

    const timeoutId = setTimeout(async () => {
      // Drafts currently support single recipient. We save the first one or none.
      // This is a known limitation until drafts are upgraded.
      const primaryUser = selectedUsers[0];

      const id = await saveDraftAsync({
        id: currentDraftId || '',
        toUserId: primaryUser?.id,
        toUserEmail: primaryUser?.email,
        toUserName: primaryUser?.full_name,
        subject,
        body,
      });
      if (id) setCurrentDraftId(id);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [subject, body, selectedUsers, open, currentDraftId, saveDraftAsync]);

  const handleClose = () => {
    // Just close, let the draft persist
    setSelectedUsers([]);
    setSubject('');
    setBody('');
    setAttachments([]);
    setExistingAttachments([]);
    setSearchTerm('');
    setCurrentDraftId(null);
    onOpenChange(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`File "${file.name}" exceeds 25MB limit`);
            continue;
          }
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      setAttachments((prev) => [...prev, ...files]);
      toast.success(`Pasted ${files.length} image(s) as attachment`);
    }
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

  const removeExistingAttachment = (attachmentId: string) => {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && searchTerm === '' && selectedUsers.length > 0) {
      // Remove the last selected user
      setSelectedUsers((prev) => prev.slice(0, -1));
    }

    if (e.key === 'Enter' && searchTerm && profiles.length > 0) {
      e.preventDefault();
      const profile = profiles[0];
      setSelectedUsers((prev) => [...prev, profile]);
      setSearchTerm('');
    }
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        toUserIds: selectedUsers.map((u) => u.id),
        toUserProfiles: selectedUsers.map((u) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
        })),
        subject,
        body,
        attachments: attachments.length > 0 ? attachments : undefined,
        existingAttachments: existingAttachments.length > 0 ? existingAttachments : undefined,
      });
      if (currentDraftId) {
        deleteDraft(currentDraftId);
      }
      toast.success('Message sent!');
      handleClose();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSelectAllUsers = async () => {
    try {
      setIsLoadingAllUsers(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (error) throw error;

      if (allProfiles) {
        // Set all users directly
        setSelectedUsers(allProfiles);
        setTotalUserCount(allProfiles.length);
        toast.success(`Selected ${allProfiles.length} users`);
      }
    } catch (error) {
      console.error('Error selecting all users:', error);
      toast.error('Failed to select all users');
    } finally {
      setIsLoadingAllUsers(false);
    }
  };

  const handleRemoveAllUsers = () => {
    setSelectedUsers([]);
    toast.success('Removed all recipients');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none rounded-none border-0 sm:w-[95vw] sm:max-w-[640px] sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border flex flex-col p-0 gap-0">
        <VisuallyHidden>
          <DialogDescription>Compose a new message</DialogDescription>
        </VisuallyHidden>
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="font-display">New Message</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* To Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>To</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedUsers.length === totalUserCount && totalUserCount > 0 ? handleRemoveAllUsers : handleSelectAllUsers}
                disabled={isLoadingAllUsers}
                className="h-6 px-2 text-xs text-muted-foreground"
              >
                {isLoadingAllUsers ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Processing...
                  </>
                ) : selectedUsers.length === totalUserCount && totalUserCount > 0 ? (
                  "Remove All Users"
                ) : (
                  "Select All Users"
                )}
              </Button>
            </div>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <div
                  className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] items-center cursor-text transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  onClick={() => setSearchOpen(true)}
                >
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm group"
                    >
                      <span>{user.full_name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">&lt;{user.email}&gt;</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUser(user.id);
                        }}
                        className="ml-1 hover:text-destructive focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <input
                    className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px]"
                    placeholder={selectedUsers.length === 0 ? "Select recipients..." : ""}
                    value={searchTerm}
                    name='searchTerm'
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (!searchOpen) setSearchOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setSearchOpen(true)}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-[calc(100vw-32px)] sm:w-[550px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()} // Prevent stealing focus from input
              >
                <Command shouldFilter={false}>
                  {/* Hidden CommandInput needed for accessibility but we use our own input above */}
                  <div className="hidden">
                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} />
                  </div>
                  <CommandList>
                    {!debouncedSearchTerm || debouncedSearchTerm.length < 2 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Type at least 2 characters to search...
                      </div>
                    ) : isSearching ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Searching...
                      </div>
                    ) : profiles.length === 0 ? (
                      <CommandEmpty>No users found.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {profiles.map((profile) => (
                          <CommandItem
                            key={profile.id}
                            value={profile.email}
                            onSelect={() => {
                              setSelectedUsers((prev) => [...prev, profile]);
                              setSearchTerm('');
                              // Keep the popover open so they can add more, or close it? 
                              // Use case "Add multiple": usually easier if it stays open or re-opens easily.
                              // But logic above clears search term, which might trigger "Type 2 chars..." view.
                              // Let's keep it open, but user has to type again.
                              // Actually, standard behavior is to focus back on input.
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{profile.full_name}</span>
                              <span className="text-xs">{profile.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
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
              name='subject'
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
              name='body'
              onChange={(e) => setBody(e.target.value)}
              onPaste={handlePaste}
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

          {/* Existing Attachments (Edit as New) */}
          {existingAttachments.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Attachments</Label>
              <div className="flex flex-wrap gap-2">
                {existingAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm border border-input"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{att.file_name}</span>
                    <span className="text-muted-foreground">({formatFileSize(att.file_size)})</span>
                    <button
                      onClick={() => removeExistingAttachment(att.id)}
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
