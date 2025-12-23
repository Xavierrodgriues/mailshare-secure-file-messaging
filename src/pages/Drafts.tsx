import { AppLayout } from '@/components/layout/AppLayout';
import { FileText, Trash2, Mail } from 'lucide-react';
import { useDrafts } from '@/hooks/useDrafts';
import { Button } from '@/components/ui/button';
import { ComposeDialog } from '@/components/mail/ComposeDialog';
import { useState } from 'react';
import { format } from 'date-fns';

export default function DraftsPage() {
  const { drafts, deleteDraft } = useDrafts();
  const [selectedDraftId, setSelectedDraftId] = useState<string | undefined>();
  const [composeOpen, setComposeOpen] = useState(false);

  const handleOpenDraft = (id: string) => {
    setSelectedDraftId(id);
    setComposeOpen(true);
  };

  const handleDeleteDraft = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDraft(id);
  };

  const handleComposeOpenChange = (open: boolean) => {
    setComposeOpen(open);
    if (!open) {
      setSelectedDraftId(undefined);
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-display font-bold">Drafts</h1>
          <p className="text-muted-foreground">{drafts.length} drafts currently saved</p>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {drafts.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h2 className="font-display font-semibold text-lg mb-2">No Drafts</h2>
                <p>Your draft messages will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  onClick={() => handleOpenDraft(draft.id)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">
                        {draft.toUserName || draft.toUserEmail || 'No Recipient'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {draft.updatedAt && format(new Date(draft.updatedAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="text-sm font-medium truncate mb-0.5">
                      {draft.subject || '(No Subject)'}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {draft.body || '(No Content)'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive bg-white hover:bg-gray-100 rounded-full shadow-sm"
                    onClick={(e) => handleDeleteDraft(e, draft.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={handleComposeOpenChange}
        draftId={selectedDraftId}
      />
    </AppLayout>
  );
}
