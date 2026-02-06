import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SharedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  created_at: string;
  message: {
    id: string;
    subject: string;
    from_user_id: string;
    to_user_id: string;
    from_profile: {
      full_name: string;
      email: string;
    };
    to_profile: {
      full_name: string;
      email: string;
    };
  };
}

export function useSharedFiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['shared-files', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select(`
          *,
          message:messages!inner(
            id,
            subject,
            from_user_id,
            to_user_id,
            from_profile:profiles!messages_from_user_id_fkey(full_name, email),
            to_profile:profiles!messages_to_user_id_fkey(full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SharedFile[];
    },
    enabled: !!user,
  });
}

// 🔽 UPDATED: use supabase.functions.invoke so JWT is automatically attached
// 🔽 UPDATED: Helper to get signed URL
export function useGetFileUrl() {
  return async (filePath: string) => {
    const { data, error } = await supabase.functions.invoke<{
      url: string;
    }>('r2-download', {
      body: { key: filePath },
    });

    if (error) {
      console.error('r2-download error:', error);
      throw error;
    }

    return data.url;
  };
}

// 🔽 UPDATED: Downloads file by opening in new tab (bypassing CORS fetch issues)
export function useDownloadFile() {
  const getFileUrl = useGetFileUrl();

  return async (filePath: string, fileName: string) => {
    try {
      const url = await getFileUrl(filePath);

      // Create a temporary link to attempt download
      // If it's same-origin, it will download.
      // If it's cross-origin (R2), 'download' attribute is ignored -> we target _blank
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank'; // Force new tab for cross-origin compliance
      a.rel = 'noopener noreferrer';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };
}
