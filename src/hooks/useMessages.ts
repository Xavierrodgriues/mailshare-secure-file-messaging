import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_deleted_sender: boolean;
  is_deleted_receiver: boolean;
  created_at: string;
  from_profile?: {
    full_name: string;
    email: string;
  };
  to_profile?: {
    full_name: string;
    email: string;
  };
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  uploaded_by_user_id: string;
  created_at: string;
}

export function useInboxMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', 'inbox', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(full_name, email)
        `)
        .eq('to_user_id', user!.id)
        .eq('is_deleted_receiver', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user,
  });
}

export function useSentMessages() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['messages', 'sent', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          to_profile:profiles!messages_to_user_id_fkey(full_name, email)
        `)
        .eq('from_user_id', user!.id)
        .eq('is_deleted_sender', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user,
  });
}

export function useMessage(messageId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['message', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(full_name, email),
          to_profile:profiles!messages_to_user_id_fkey(full_name, email),
          attachments(*)
        `)
        .eq('id', messageId!)
        .single();

      if (error) throw error;
      return data as Message;
    },
    enabled: !!messageId && !!user,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      toUserId,
      subject,
      body,
      attachments,
    }: {
      toUserId: string;
      subject: string;
      body: string;
      attachments?: File[];
    }) => {
      // Create message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          from_user_id: user!.id,
          to_user_id: toUserId,
          subject,
          body,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          const filePath = `${user!.id}/${message.id}/${file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Create attachment record
          const { error: attachmentError } = await supabase
            .from('attachments')
            .insert({
              message_id: message.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by_user_id: user!.id,
            });

          if (attachmentError) throw attachmentError;
        }
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ messageId, isSender }: { messageId: string; isSender: boolean }) => {
      const updateField = isSender ? 'is_deleted_sender' : 'is_deleted_receiver';

      const { error } = await supabase
        .from('messages')
        .update({ [updateField]: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function cleanSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(Re|Fwd|FW|RE|FWD):\s*/i, '') // Remove standard prefixes
    .replace(/^\[.*?\]\s*/, '') // Remove [Tags]
    .trim();
}

export function useConversation(messageId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation', messageId],
    queryFn: async () => {
      // 1. Fetch the selected message to get context (subject, participants)
      const { data: currentMessage, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId!)
        .single();

      if (fetchError) throw fetchError;

      const baseSubject = cleanSubject(currentMessage.subject);
      const otherUserId = currentMessage.from_user_id === user!.id
        ? currentMessage.to_user_id
        : currentMessage.from_user_id;

      // 2. Fetch all messages in the conversation
      // Match: (A->B OR B->A) AND similar subject
      const { data: messages, error: listError } = await supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(full_name, email),
          to_profile:profiles!messages_to_user_id_fkey(full_name, email),
          attachments(*)
        `)
        .or(`and(from_user_id.eq.${user!.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user!.id})`)
        .order('created_at', { ascending: true }); // Oldest first

      if (listError) throw listError;

      // Filter in memory for subject match (regex is hard in postgrest)
      // Also filter out deleted messages
      const conversationMessages = (messages as Message[]).filter(msg => {
        // Subject match
        const msgBaseSubject = cleanSubject(msg.subject);
        if (msgBaseSubject !== baseSubject && !msg.subject.includes(baseSubject)) {
          // allow partial match if subject became "Re: Re: subject"
          // But strict base subject match is safer for "Re: hello" vs "Re: hello world"
          // Let's stick to cleanSubject equality for now, or startWith
          // The user spec says "Same base subject"
          return false;
        }

        // Deletion check
        if (msg.from_user_id === user!.id && msg.is_deleted_sender) return false;
        if (msg.to_user_id === user!.id && msg.is_deleted_receiver) return false;

        return true;
      });

      return {
        messages: conversationMessages,
        baseSubject,
        otherUserId
      };
    },
    enabled: !!messageId && !!user,
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (messageIds.length === 0) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}
