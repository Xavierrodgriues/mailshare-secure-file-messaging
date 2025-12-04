import { AppLayout } from '@/components/layout/AppLayout';
import { FileText } from 'lucide-react';

export default function DraftsPage() {
  return (
    <AppLayout>
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="font-display font-semibold text-lg mb-2">Drafts</h2>
          <p>Your draft messages will appear here</p>
          <p className="text-sm mt-1">This feature is coming soon</p>
        </div>
      </div>
    </AppLayout>
  );
}
