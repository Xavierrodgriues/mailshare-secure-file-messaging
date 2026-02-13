import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SignatureSettings } from '@/components/SignatureSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, PenTool } from 'lucide-react';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('signature');

    return (
        <AppLayout>
            <div className="h-full overflow-y-auto">
                <div className="container mx-auto py-6 max-w-5xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Manage your account settings and preferences.
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                            <TabsTrigger value="signature" className="flex items-center gap-2">
                                <PenTool className="h-4 w-4" />
                                Signature
                            </TabsTrigger>
                            <TabsTrigger value="account" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Account
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="signature" className="space-y-6 outline-none pb-12">
                            <SignatureSettings />
                        </TabsContent>

                        <TabsContent value="account" className="space-y-6 outline-none pb-12">
                            <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                                <h3 className="text-lg font-medium mb-2">Account Settings</h3>
                                <p className="text-sm text-muted-foreground">
                                    Account management features are coming soon.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
