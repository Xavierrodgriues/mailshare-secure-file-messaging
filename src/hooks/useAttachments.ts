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

export function useDownloadFile() {
  return async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .download(filePath);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}
