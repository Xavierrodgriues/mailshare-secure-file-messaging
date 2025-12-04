import { AppLayout } from '@/components/layout/AppLayout';
import { Trash2 } from 'lucide-react';

export default function TrashPage() {
  return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="font-display font-semibold text-lg mb-2">Trash</h2>
          <p>Deleted messages will appear here</p>
          <p className="text-sm mt-1">Messages in trash are permanently deleted after 30 days</p>
        </div>
      </div>
    </AppLayout>
  );
}
