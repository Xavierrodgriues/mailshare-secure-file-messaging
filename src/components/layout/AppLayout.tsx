import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Loader2 } from 'lucide-react';
import { ComposeDialog } from '@/components/mail/ComposeDialog';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar onComposeClick={() => setComposeOpen(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onComposeClick={() => setComposeOpen(true)} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </div>
  );
}
