import { Loader2 } from "lucide-react";

export function FullScreenLoader() {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
            role="status"
            aria-label="Loading application"
        >
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">Loading...</p>
            </div>
        </div>
    );
}
