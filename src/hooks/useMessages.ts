import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Recipient {
  name: string;
  email: string;
}

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
  recipients?: Recipient[];
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

// Response we expect back from the r2-upload edge function
interface R2UploadResult {
  key: string;   // R2 object key
  url: string;   // public or signed URL (from edge function)
  name: string;
  size: number;
  type: string;
  messageId?: string;
  userId?: string;
}

export function useInboxMessages() {
  const { user } = useAuth();
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: ['messages', 'inbox', user?.id],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(full_name, email)
        `)
        .eq('to_user_id', user!.id)
        .eq('is_deleted_receiver', false)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Message[];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return null;
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!user,
  });
}

export function useSentMessages() {
  const { user } = useAuth();
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: ['messages', 'sent', user?.id],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('messages')
        .select(`
          *,
          to_profile:profiles!messages_to_user_id_fkey(full_name, email)
        `)
        .eq('from_user_id', user!.id)
        .eq('is_deleted_sender', false)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Message[];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return null;
      return lastPage[lastPage.length - 1].created_at;
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

/**
 * UPDATED: uses r2-upload edge function instead of supabase.storage
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      toUserIds,
      toUserProfiles,
      subject,
      body,
      attachments,
      existingAttachments,
    }: {
      toUserIds: string[];
      toUserProfiles: { id: string; name: string; email: string }[];
      subject: string;
      body: string;
      attachments?: File[];
      existingAttachments?: Attachment[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (!toUserIds || toUserIds.length === 0) {
        throw new Error('No recipients selected');
      }

      // Loop through each recipient and send the message
      // Note: Ideally we would batch this or optimize attachment uploads, 
      // but 'create one message row per recipient' is the requirement.
      const messages = [];

      for (const toUserId of toUserIds) {
        // Build recipients array for all recipients
        const recipientsData = toUserProfiles.map(p => ({
          name: p.name,
          email: p.email,
        }));

        // 1) Create message
        const { data: message, error: messageError } = await supabase
          .from('messages')
          .insert({
            from_user_id: user.id,
            to_user_id: toUserId,
            subject,
            body,
            recipients: recipientsData,
          })
          .select()
          .single();

        if (messageError) throw messageError;
        messages.push(message);

        // 2) Upload attachments to Cloudflare R2 via edge function
        // Optimization: We could upload once and reuse keys, but current implementation of R2 edge function
        // might assume one-to-one or we don't want to refactor the edge function right now.
        // We will just repeat the upload for safety and correctness with current schema.
        if (attachments && attachments.length > 0) {
          // get access token for auth header
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) throw sessionError;
          const accessToken = session?.access_token ?? '';

          for (const file of attachments) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('messageId', message.id);
            formData.append('userId', user.id);

            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
              }
            );

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`R2 upload failed: ${errText}`);
            }

            const r2: R2UploadResult = await response.json();

            // 3) Create attachment row pointing to R2
            const { error: attachmentError } = await supabase
              .from('attachments')
              .insert({
                message_id: message.id,
                file_name: r2.name,
                file_path: r2.key,      // store R2 object key here
                file_size: r2.size,
                file_type: r2.type,
                uploaded_by_user_id: user.id,
                // (optional) add a 'public_url' column later and store r2.url
              });

            if (attachmentError) throw attachmentError;
          }
        }

        // 3) Existing Attachments (Reuse R2 keys)
        if (existingAttachments && existingAttachments.length > 0) {
          for (const att of existingAttachments) {
            const { error: attError } = await supabase
              .from('attachments')
              .insert({
                message_id: message.id,
                file_name: att.file_name,
                file_path: att.file_path, // Reuse existing R2 key
                file_size: att.file_size,
                file_type: att.file_type,
                uploaded_by_user_id: user.id,
              });

            if (attError) throw attError;
          }
        }
      }

      return messages;
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
    mutationFn: async ({
      messageId,
      isSender,
    }: {
      messageId: string;
      isSender: boolean;
    }) => {
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
      const otherUserId =
        currentMessage.from_user_id === user!.id
          ? currentMessage.to_user_id
          : currentMessage.from_user_id;

      // 2. Fetch all messages in the conversation
      const { data: messages, error: listError } = await supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(full_name, email),
          to_profile:profiles!messages_to_user_id_fkey(full_name, email),
          attachments(*)
        `)
        .or(
          `and(from_user_id.eq.${user!.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: true }); // Oldest first

      if (listError) throw listError;

      const conversationMessages = (messages as Message[]).filter((msg) => {
        const msgBaseSubject = cleanSubject(msg.subject);
        if (
          msgBaseSubject !== baseSubject &&
          !msg.subject.includes(baseSubject)
        ) {
          return false;
        }

        if (msg.from_user_id === user!.id && msg.is_deleted_sender) return false;
        if (msg.to_user_id === user!.id && msg.is_deleted_receiver) return false;

        return true;
      });

      return {
        messages: conversationMessages,
        baseSubject,
        otherUserId,
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

export function useConversationInfinite(messageId: string | undefined) {
  const { user } = useAuth();
  const PAGE_SIZE = 20;

  // 1. Fetch metadata first (subject, participants)
  const metadataQuery = useQuery({
    queryKey: ['conversation_metadata', messageId],
    queryFn: async () => {
      const { data: currentMessage, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId!)
        .single();

      if (error) throw error;

      const baseSubject = cleanSubject(currentMessage.subject);
      const otherUserId =
        currentMessage.from_user_id === user!.id
          ? currentMessage.to_user_id
          : currentMessage.from_user_id;

      return { baseSubject, otherUserId };
    },
    enabled: !!messageId && !!user,
  });

  // 2. Infinite query for messages
  const messagesQuery = useInfiniteQuery({
    queryKey: ['conversation_infinite', messageId],
    queryFn: async ({ pageParam }) => {
      const { baseSubject, otherUserId } = metadataQuery.data!;

      let query = supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(full_name, email),
          to_profile:profiles!messages_to_user_id_fkey(full_name, email),
          attachments(*)
        `)
        .or(
          `and(from_user_id.eq.${user!.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: false }) // Newest first for fetching
        .limit(PAGE_SIZE);

      // Keyset pagination using created_at
      if (pageParam) {
        query = query.lt('created_at', pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by subject and deleted status
      const filtered = (data as Message[]).filter((msg) => {
        const msgBaseSubject = cleanSubject(msg.subject);
        if (
          msgBaseSubject !== baseSubject &&
          !msg.subject.includes(baseSubject)
        ) {
          return false;
        }

        if (msg.from_user_id === user!.id && msg.is_deleted_sender) return false;
        if (msg.to_user_id === user!.id && msg.is_deleted_receiver) return false;

        return true;
      });

      return filtered;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return null;
      return lastPage[lastPage.length - 1].created_at;
    },
    enabled: !!metadataQuery.data && !!user,
  });

  return {
    ...messagesQuery,
    baseSubject: metadataQuery.data?.baseSubject,
    otherUserId: metadataQuery.data?.otherUserId,
    metadataLoading: metadataQuery.isLoading,
  };
}
