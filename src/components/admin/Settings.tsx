import { Settings as SettingsIcon, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Settings() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold tracking-tight">System Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure global platform parameters and security policies.</p>
            </div>

            <Card className="border border-dashed bg-muted/20 py-24">
                <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="bg-background h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <SettingsIcon className="h-8 w-8 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-lg font-bold">Configuration Panel Initializing</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        Global system settings, API keys, and notification preferences will be configurable from this interface.
                    </p>
                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100 text-indigo-700 text-xs font-medium">
                        <Shield className="h-4 w-4" />
                        Planned for Phase 2 implementation
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
