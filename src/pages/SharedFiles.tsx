import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedFiles, useDownloadFile } from '@/hooks/useAttachments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Download, FolderOpen, Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils';

export default function SharedFilesPage() {
  const { user } = useAuth();
  const { data: files, isLoading } = useSharedFiles();
  const downloadFile = useDownloadFile();

  const filesSharedByMe = files?.filter(
    (f) => f.message.from_user_id === user?.id
  ) || [];

  const filesSharedWithMe = files?.filter(
    (f) => f.message.to_user_id === user?.id
  ) || [];

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      await downloadFile(filePath, fileName);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const FileTable = ({ files, showColumn }: { files: typeof filesSharedByMe; showColumn: 'sender' | 'recipient' }) => (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Scrollable container with bottom padding for scrollbar visibility */}
      <div className="overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <table className="w-full">
          <thead className="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground w-full md:w-auto">File</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                {showColumn === 'sender' ? 'From' : 'To'}
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Size</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {files.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No files found
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Paperclip className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{file.file_name}</p>
                        {/* Mobile-only stacked info */}
                        <div className="flex flex-col gap-0.5 md:hidden">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'MMM d')}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {showColumn === 'sender' ? 'From: ' : 'To: '}
                            {showColumn === 'sender'
                              ? file.message.from_profile.full_name
                              : file.message.to_profile.full_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm">
                      {showColumn === 'sender'
                        ? file.message.from_profile.full_name
                        : file.message.to_profile.full_name}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(file.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.file_path, file.file_name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FolderOpen className="h-6 w-6 text-primary" />
          <h1 className="font-display font-semibold text-xl">Shared Files</h1>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="received">
              Files Shared With Me ({filesSharedWithMe.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Files I Shared ({filesSharedByMe.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="animate-fade-in">
            <FileTable files={filesSharedWithMe} showColumn="sender" />
          </TabsContent>

          <TabsContent value="sent" className="animate-fade-in">
            <FileTable files={filesSharedByMe} showColumn="recipient" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
