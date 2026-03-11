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
      ccUserIds = [],
      ccUserProfiles = [],
      bccUserIds = [],
      bccUserProfiles = [],
      subject,
      body,
      attachments,
      existingAttachments,
    }: {
      toUserIds: string[];
      toUserProfiles: { id: string; name: string; email: string }[];
      ccUserIds?: string[];
      ccUserProfiles?: { id: string; name: string; email: string }[];
      bccUserIds?: string[];
      bccUserProfiles?: { id: string; name: string; email: string }[];
      subject: string;
      body: string;
      attachments?: File[];
      existingAttachments?: Attachment[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      if (!toUserIds || toUserIds.length === 0) {
        throw new Error('No recipients selected');
      }

      // Build recipients lists
      // Full list (for sender's Sent copy): to + cc + bcc
      const fullRecipients = [
        ...toUserProfiles.map(p => ({ id: p.id, name: p.name, email: p.email, type: 'to' })),
        ...ccUserProfiles.map(p => ({ id: p.id, name: p.name, email: p.email, type: 'cc' })),
        ...bccUserProfiles.map(p => ({ id: p.id, name: p.name, email: p.email, type: 'bcc' })),
      ];

      // Visible list (for TO and CC recipients): to + cc only — NO bcc
      const visibleRecipients = [
        ...toUserProfiles.map(p => ({ id: p.id, name: p.name, email: p.email, type: 'to' })),
        ...ccUserProfiles.map(p => ({ id: p.id, name: p.name, email: p.email, type: 'cc' })),
      ];

      let insertedMessages: any[] = [];
      const chunkSize = 500;

      // 1) Insert message rows for TO recipients (visible recipients list, no BCC)
      for (let i = 0; i < toUserIds.length; i += chunkSize) {
        const chunk = toUserIds.slice(i, i + chunkSize);
        const messagesToInsert = chunk.map(toUserId => ({
          from_user_id: user.id,
          to_user_id: toUserId,
          subject,
          body,
          // Store fullRecipients so sender can see TO+CC+BCC in Sent view.
          // TO/CC recipients won't see BCC names — the UI filters them out by type.
          recipients: fullRecipients,
        }));

        const { data: chunkMessages, error: messageError } = await supabase
          .from('messages')
          .insert(messagesToInsert)
          .select();

        if (messageError) throw messageError;
        insertedMessages = [...insertedMessages, ...chunkMessages];
      }

      // 2) Insert message rows for CC recipients (visible recipients list, no BCC)
      if (ccUserIds.length > 0) {
        for (let i = 0; i < ccUserIds.length; i += chunkSize) {
          const chunk = ccUserIds.slice(i, i + chunkSize);
          const ccMessages = chunk.map(ccUserId => ({
            from_user_id: user.id,
            to_user_id: ccUserId,
            subject,
            body,
            // Same as above — store fullRecipients for sender visibility.
            recipients: fullRecipients,
          }));

          const { data: chunkMessages, error: messageError } = await supabase
            .from('messages')
            .insert(ccMessages)
            .select();

          if (messageError) throw messageError;
          insertedMessages = [...insertedMessages, ...chunkMessages];
        }
      }

      // 3) Insert message rows for BCC recipients
      //    Each row stores: all TO + all CC recipients (visibleRecipients) + this BCC user.
      //    - Sender opening any thread sees the full TO/CC context + BCC entry.
      //    - BCC recipient sees TO/CC (standard email behaviour) + themselves as bcc.
      //    - Other BCC recipients are hidden since each BCC row only includes itself.
      const bccInsertedMessages: any[] = [];
      if (bccUserIds.length > 0) {
        for (let i = 0; i < bccUserIds.length; i += chunkSize) {
          const chunk = bccUserIds.slice(i, i + chunkSize);
          for (const bccUserId of chunk) {
            const bccProfile = bccUserProfiles.find(p => p.id === bccUserId);
            const { data: bccMessages, error: messageError } = await supabase
              .from('messages')
              .insert([{
                from_user_id: user.id,
                to_user_id: bccUserId,
                subject,
                body,
                // TO + CC are visible; only this BCC user is included (not other BCC recipients)
                recipients: [
                  ...visibleRecipients,
                  { id: bccUserId, name: bccProfile?.name, email: bccProfile?.email, type: 'bcc' },
                ],
              }])
              .select();

            if (messageError) throw messageError;
            insertedMessages = [...insertedMessages, ...(bccMessages || [])];
            bccInsertedMessages.push(...(bccMessages || []));
          }
        }
      }

      // 4) Insert a sender copy in Sent with full recipients (to + cc + bcc visible to sender)
      // The existing TO inserts above are the primary rows; sender sees Sent via from_user_id.
      // No extra sender row needed — sender sees records via from_user_id in useSentMessages.

      const attachmentRowsToInsert: any[] = [];

      // 5) Upload attachments to Cloudflare R2 ONCE
      if (attachments && attachments.length > 0) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        const accessToken = session?.access_token ?? '';

        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('messageId', insertedMessages[0].id);
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

          for (const msg of insertedMessages) {
            attachmentRowsToInsert.push({
              message_id: msg.id,
              file_name: r2.name,
              file_path: r2.key,
              file_size: r2.size,
              file_type: r2.type,
              uploaded_by_user_id: user.id,
            });
          }
        }
      }

      // 6) Existing Attachments (Reuse R2 keys)
      if (existingAttachments && existingAttachments.length > 0) {
        for (const att of existingAttachments) {
          for (const msg of insertedMessages) {
            attachmentRowsToInsert.push({
              message_id: msg.id,
              file_name: att.file_name,
              file_path: att.file_path,
              file_size: att.file_size,
              file_type: att.file_type,
              uploaded_by_user_id: user.id,
            });
          }
        }
      }

      // Batch insert attachments
      if (attachmentRowsToInsert.length > 0) {
        const attChunkSize = 1000;
        for (let i = 0; i < attachmentRowsToInsert.length; i += attChunkSize) {
          const { error: attachmentError } = await supabase
            .from('attachments')
            .insert(attachmentRowsToInsert.slice(i, i + attChunkSize));

          if (attachmentError) throw attachmentError;
        }
      }

      return insertedMessages;
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
