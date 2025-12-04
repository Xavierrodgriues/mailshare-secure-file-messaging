import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export function useProfiles(searchTerm?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profiles', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user!.id)
        .order('full_name');

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user,
  });
}
