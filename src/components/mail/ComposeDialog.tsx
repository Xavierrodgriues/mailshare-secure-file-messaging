import { useState, useEffect, useRef } from 'react';
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
import { Send, Paperclip, X, Loader2, UserPlus } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useDrafts } from '@/hooks/useDrafts';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [showRecipientActions, setShowRecipientActions] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [hasSignatureAppended, setHasSignatureAppended] = useState(false);

  const { data: profiles = [], isLoading: isSearching } = useProfiles(
    debouncedSearchTerm,
    selectedUsers.map((u) => u.id)
  );

  const sendMessage = useSendMessage();
  const { saveDraftAsync, deleteDraft, getDraft, drafts } = useDrafts();
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Fetch signature
  useEffect(() => {
    const fetchSignature = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('signature')
          .eq('id', user.id)
          .single();
        if (data && data.signature) {
          setSignature(data.signature);
        }
      }
    };
    if (open) {
      fetchSignature();
    }
  }, [open]);

  // Append signature when opening empty compose
  useEffect(() => {
    if (open && mode === 'compose' && !draftId && !replyTo && signature && !body && !hasSignatureAppended) {
      setBody(`<br/><br/>${signature}`);
      setHasSignatureAppended(true);
    }
  }, [open, mode, draftId, replyTo, signature, body, hasSignatureAppended]);

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
          setSelectedUsers([{
            id: draft.toUserId,
            full_name: draft.toUserName,
            email: draft.toUserEmail,
            avatar_url: null,
          } as Profile]);
        }
        setHasSignatureAppended(true); // Don't double append
      }
    }
  }, [draftId, open, drafts]);

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

      // For reply, we usually append signature at the very top or bottom.
      // Let's assume user wants to type above signature.
      if (signature && !body) {
        setBody(`<br/><br/>${signature}`);
        setHasSignatureAppended(true);
      }
    }
  }, [replyTo, open, draftId, mode, signature]);

  // Handle Edit as New setup
  useEffect(() => {
    if (mode === 'edit-as-new' && initialData && open) {
      setSubject(initialData.subject.startsWith('Edit:') ? initialData.subject : `Edit: ${initialData.subject}`);
      setBody(initialData.body || '');

      if (initialData.to_profile && initialData.to_user_id) {
        setSelectedUsers([{
          id: initialData.to_user_id,
          full_name: initialData.to_profile.full_name,
          email: initialData.to_profile.email,
          avatar_url: null,
        } as Profile]);
      } else {
        setSelectedUsers([]);
      }

      if (initialData.attachments) {
        setExistingAttachments(initialData.attachments);
      }
      setHasSignatureAppended(true);
    }

    if (mode === 'forward' && initialData && open) {
      setSubject(initialData.subject.startsWith('Fwd:') ? initialData.subject : `Fwd: ${initialData.subject}`);

      const forwardedHeader = `
<br/><br/>
---------- Forwarded message ---------<br/>
From: ${initialData.from_profile?.full_name || 'Unknown'} &lt;${initialData.from_profile?.email || 'unknown@example.com'}&gt;<br/>
Date: ${new Date(initialData.created_at).toLocaleString()}<br/>
Subject: ${initialData.subject}<br/>
To: ${initialData.to_profile?.full_name || 'Unknown'} &lt;${initialData.to_profile?.email || 'unknown@example.com'}&gt;<br/>
<br/>
`;
      const newBody = signature ? `<br/><br/>${signature}${forwardedHeader}${initialData.body || ''}` : `${forwardedHeader}${initialData.body || ''}`;

      setBody(newBody);

      setSelectedUsers([]);

      if (initialData.attachments) {
        setExistingAttachments(initialData.attachments);
      }
      setHasSignatureAppended(true);
    }
  }, [mode, initialData, open, signature]);

  // Auto-save draft logic (same as before but beware of HTML content)
  useEffect(() => {
    if (!open) return;
    // Basic check for empty: plain text check might be better but checking raw HTML string for minimal length is okayish
    const isBodyEmpty = !body || body === '<p><br></p>';
    if (!subject && isBodyEmpty && selectedUsers.length === 0 && !currentDraftId) return;

    const timeoutId = setTimeout(async () => {
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
    setSelectedUsers([]);
    setSubject('');
    setBody('');
    setAttachments([]);
    setExistingAttachments([]);
    setSearchTerm('');
    setCurrentDraftId(null);
    setHasSignatureAppended(false);
    onOpenChange(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Note: ReactQuill handles text paste. We only care about images if we want to handle them as attachments?
    // ReactQuill by default embeds images as base64.
    // If we want to intercept paste to create attachments, we need a custom handler or ref.
    // For now, let's stick to standard behavior or just allow attachments via button.
    // The previous Textarea code handled image paste as attachment.
    // ReactQuill's onChange content will include base64 images if pasted.
    // Ideally we'd upload them, but that's complex.
    // Let's keep the attachment logic for explicit file uploads.
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
      setSelectedUsers((prev) => prev.slice(0, -1));
    }
    if (e.key === 'Enter' && searchTerm && profiles.length > 0) {
      e.preventDefault();
      const profile = profiles[0];
      // Prevent duplicate
      if (!selectedUsers.some(u => u.id === profile.id)) {
        setSelectedUsers((prev) => [...prev, profile]);
      }
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

    // Deduplicate users just in case
    const uniqueUsers = Array.from(new Map(selectedUsers.map(u => [u.id, u])).values());

    try {
      await sendMessage.mutateAsync({
        toUserIds: uniqueUsers.map((u) => u.id),
        toUserProfiles: uniqueUsers.map((u) => ({
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

  const KICKOFF_EMAILS = [
    'sandipjayswal@yuviiconsultancy.com',
    'nilesh@yuviiconsultancy.com',
    'raj@yuviiconsultancy.com',
    'niraj@yuviiconsultancy.com',
    'darshan@yuviiconsultancy.com',
    'dhruvgor@yuviiconsultancy.com'
  ];

  const [isLoadingKickoffUsers, setIsLoadingKickoffUsers] = useState(false);
  const areAllKickoffUsersSelected = KICKOFF_EMAILS.every(email =>
    selectedUsers.some(u => u.email?.toLowerCase() === email.toLowerCase())
  );

  const handleKickoffUsers = async () => {
    if (areAllKickoffUsersSelected) {
      setSelectedUsers(prev => prev.filter(u => !KICKOFF_EMAILS.some(e => e.toLowerCase() === (u.email?.toLowerCase() || ''))));
      toast.success('Removed Kickoff members');
      return;
    }
    try {
      setIsLoadingKickoffUsers(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }
      const { data: kickoffProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('email', KICKOFF_EMAILS)
        .neq('id', user.id);

      if (error) throw error;
      if (kickoffProfiles && kickoffProfiles.length > 0) {
        setSelectedUsers(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProfiles = kickoffProfiles.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProfiles];
        });
        toast.success(`Added ${kickoffProfiles.length} Kickoff members`);
      } else {
        toast.info('No Kickoff members found');
      }
    } catch (error) {
      console.error('Error selecting kickoff users:', error);
      toast.error('Failed to select kickoff users');
    } finally {
      setIsLoadingKickoffUsers(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-none rounded-none border-0 sm:w-[95vw] sm:max-w-[800px] sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border flex flex-col p-0 gap-0">
        <VisuallyHidden>
          <DialogDescription>Compose a new message</DialogDescription>
        </VisuallyHidden>
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="font-display">New Message</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* To Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center h-8">
              <Label>To</Label>
              <div className="flex items-center gap-1">
                {showRecipientActions && (
                  <div className="flex items-center gap-1 mr-1 animate-in fade-in slide-in-from-right-4 duration-300">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectedUsers.length === totalUserCount && totalUserCount > 0 ? handleRemoveAllUsers : handleSelectAllUsers}
                      disabled={isLoadingAllUsers}
                      className="h-7 px-3 text-xs"
                    >
                      {isLoadingAllUsers ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : selectedUsers.length === totalUserCount && totalUserCount > 0 ? (
                        "Remove All"
                      ) : (
                        "Select All"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleKickoffUsers}
                      disabled={isLoadingKickoffUsers}
                      className="h-7 px-3 text-xs"
                    >
                      {isLoadingKickoffUsers ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : areAllKickoffUsersSelected ? (
                        "Remove Kickoff"
                      ) : (
                        "Kickoff"
                      )}
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-7 w-7 rounded-full transition-colors", showRecipientActions && "bg-muted text-foreground")}
                  onClick={() => setShowRecipientActions(!showRecipientActions)}
                  title={showRecipientActions ? "Hide options" : "Show bulk actions"}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
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
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command shouldFilter={false}>
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
                              // Prevent duplicate selection
                              if (!selectedUsers.some(u => u.id === profile.id)) {
                                setSelectedUsers((prev) => [...prev, profile]);
                              }
                              setSearchTerm('');
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
            <div className="bg-background">
              <ReactQuill
                theme="snow"
                value={body}
                onChange={setBody}
                modules={modules}
                formats={formats}
                className="min-h-[250px] mb-12 sm:mb-8"
              />
            </div>
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

          {/* Existing Attachments */}
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
