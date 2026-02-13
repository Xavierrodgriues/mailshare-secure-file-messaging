import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  signature?: string | null;
}

export function useProfiles(searchTerm?: string, excludedIds: string[] = []) {
  const { user } = useAuth();
  const safeSearch = searchTerm?.trim();
  // Only run query if we have a search term with at least 2 characters, or if no search term (though UI prevents this now)
  // Actually, per requirements: "Do not load all users on initial render" and "Trigger search only after 2 characters"
  // So if (!searchTerm || searchTerm.length < 2), we should return empty.

  const shouldFetch = !!user && !!safeSearch && safeSearch.length >= 2;

  return useQuery({
    queryKey: ['profiles', searchTerm, JSON.stringify(excludedIds)],
    queryFn: async () => {
      // Return empty if logic fails but query still runs for some reason (though 'enabled' handles this)
      if (!safeSearch || safeSearch.length < 2) return [];

      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user!.id)
        .order('full_name');

      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }

      if (safeSearch) {
        query = query.or(`full_name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
      }

      const { data, error } = await query.limit(10); // Limit to 10 as requested

      if (error) throw error;
      return data as Profile[];
    },
    enabled: shouldFetch,
    initialData: [], // Start with empty list
  });
}
