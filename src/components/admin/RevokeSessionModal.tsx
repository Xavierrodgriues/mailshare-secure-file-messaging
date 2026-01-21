import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Loader2 } from "lucide-react";

interface RevokeSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    isLoading: boolean;
}

export function RevokeSessionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: RevokeSessionModalProps) {
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password) {
            onConfirm(password);
            setPassword("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center border border-rose-100">
                            <ShieldAlert className="h-5 w-5 text-rose-500" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Revoke Session</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                        Enter the admin password to terminate this session.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Password"
                            className="h-11"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                        <p className="text-[11px] text-rose-500 font-medium">
                            Warning: 3 failed attempts will trigger self-logout.
                        </p>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !password}
                            className="flex-1 bg-slate-900 hover:bg-black"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isLoading ? "Verifying..." : "Confirm"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 border"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
