import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SystemLogs() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-bold tracking-tight">System Audit Logs</h2>
                <p className="text-sm text-muted-foreground mt-1">Track system events and security audits.</p>
            </div>

            <Card className="border border-dashed bg-muted/20 py-24">
                <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="bg-background h-16 w-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <FileText className="h-8 w-8 text-muted-foreground opacity-30" />
                    </div>
                    <h3 className="text-lg font-bold">Logs Module Under Development</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        We are working on a comprehensive logging system to monitor real-time system activities and security events.
                    </p>
                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-700 text-xs font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Coming soon in the next update
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
