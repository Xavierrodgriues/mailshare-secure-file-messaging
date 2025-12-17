import { AppLayout } from '@/components/layout/AppLayout';
import { useSharedFiles, useDownloadFile } from '@/hooks/useAttachments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Download, FolderOpen, Paperclip, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils';
import { useState } from 'react';

export default function SharedFilesPage() {
  const { user } = useAuth();
  const { data: files, isLoading } = useSharedFiles();
  const downloadFile = useDownloadFile();
  const [searchQuery, setSearchQuery] = useState('');

  

  const filesSharedByMe = files?.filter(
    (f) => f.message.from_user_id === user?.id
  ) || [];

  const filesSharedWithMe = files?.filter(
    (f) => f.message.to_user_id === user?.id
  ) || [];

  // Filter files based on search query
  const filterFilesBySearch = (fileList: typeof filesSharedByMe) => {
    if (!searchQuery.trim()) return fileList;
    return fileList.filter((file) =>
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredFilesSharedByMe = filterFilesBySearch(filesSharedByMe);
  const filteredFilesSharedWithMe = filterFilesBySearch(filesSharedWithMe);

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
      {/* Scrollable container with responsive height and bottom padding */}
      <div className="overflow-y-auto max-h-[calc(100vh-320px)] md:max-h-[calc(100vh-280px)] pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <table className="w-full">
          <thead className="bg-muted/90 sticky top-0 z-10 backdrop-blur-sm hidden md:table-header-group">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground md:w-auto">File</th>
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
                  <td className="p-3 md:p-4 align-top md:align-middle">
                    <div className="flex items-start md:items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 md:mt-0">
                        <Paperclip className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm break-all">{file.file_name}</p>
                        {/* Mobile-only stacked info */}
                        <div className="flex flex-col gap-0.5 md:hidden mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'MMM d')} • {showColumn === 'sender' ? 'From' : 'To'} {showColumn === 'sender' ? file.message.from_profile.full_name : file.message.to_profile.full_name}
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
                  <td className="p-3 md:p-4 text-right align-top md:align-middle">
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
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <FolderOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <h1 className="font-display font-semibold text-lg md:text-xl">Shared Files</h1>
        </div>

        {/* Search Input */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 md:pl-10 md:pr-4 md:py-2 rounded-lg border border-border bg-background text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
          </div>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="received">
              Files Shared With Me ({filteredFilesSharedWithMe.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Files I Shared ({filteredFilesSharedByMe.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="animate-fade-in">
            <FileTable files={filteredFilesSharedWithMe} showColumn="sender" />
          </TabsContent>

          <TabsContent value="sent" className="animate-fade-in">
            <FileTable files={filteredFilesSharedByMe} showColumn="recipient" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
