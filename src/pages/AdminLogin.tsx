import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Loader2,
    ArrowRight,
    ShieldCheck,
    ChevronLeft,
    Smartphone,
    Mail,
    Lock,
    KeyRound
} from 'lucide-react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { triggerConfetti } from '@/lib/confetti';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/admin/auth';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'setup' | 'login'>('email');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [qrCodeData, setQrCodeData] = useState<{ secret: string; qrCode: string } | null>(null);

    const getFingerprint = () => {
        let fp = localStorage.getItem('adminFingerprint');
        if (!fp) {
            fp = crypto.randomUUID();
            localStorage.setItem('adminFingerprint', fp);
        }
        return fp;
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (data.status === 'setup_needed') {
                const setupRes = await fetch(`${API_URL}/setup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const setupData = await setupRes.json();
                setQrCodeData(setupData);
                setStep('setup');
            } else if (data.status === 'verify_needed') {
                setStep('login');
            } else if (data.status === 'forbidden') {
                toast.error(data.message || 'Admin already registered. Access denied.');
            } else {
                toast.error('Unexpected response from server');
            }
        } catch (error) {
            toast.error('Failed to connect to authentication server');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) return;

        setLoading(true);
        try {
            const fingerprint = getFingerprint();
            const res = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    token: otp,
                    fingerprintId: fingerprint
                }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminSessionStart', Date.now().toString());
                toast.success('Admin authentication successful');
                triggerConfetti();
                navigate('/admin/dashboard');
            } else {
                toast.error('Invalid verification code');
                setOtp('');
            }
        } catch (error) {
            toast.error('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-[440px] border-none shadow-2xl rounded-[32px] overflow-hidden bg-white animate-in fade-in zoom-in duration-500">
                <CardContent className="pt-12 pb-14 px-10">
                    {/* Header Section */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
                            <div className="relative bg-primary/10 p-5 rounded-2xl border border-primary/20">
                                <ShieldCheck className="h-10 w-10 text-primary" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                            {step === 'email' ? 'Admin Gateway' : 'Security Verification'}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium px-4">
                            {step === 'email' && "Identify yourself to access the administration panel."}
                            {step === 'login' && "Enter the verification code from your authenticator app."}
                            {step === 'setup' && "Scan the QR code to configure your administrator access."}
                        </p>
                    </div>

                    {/* Conditional Rendering Steps */}
                    <div className="space-y-8">
                        {step === 'email' && (
                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Administrator Email</Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary">
                                            <Mail className="h-full w-full" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@yuviiconsultancy.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-14 pl-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                                    <span className="mr-2">Continue Access</span>
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            </form>
                        )}

                        {step === 'setup' && qrCodeData && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col items-center">
                                    <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative">
                                        <img src={qrCodeData.qrCode} alt="Setup QR Code" className="w-48 h-48 rounded-lg" />
                                        <div className="absolute -top-3 -right-3 bg-primary text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
                                            <Smartphone className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-100/80 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <KeyRound className="h-3 w-3" />
                                        TOTP Setup Mode
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-3 text-center">
                                        <Label className="text-slate-700 font-bold">Verification Code</Label>
                                        <div className="flex justify-center py-2">
                                            <InputOTP
                                                maxLength={6}
                                                value={otp}
                                                onChange={(value) => setOtp(value)}
                                                onComplete={() => handleVerify()}
                                                autoFocus
                                            >
                                                <InputOTPGroup className="gap-3">
                                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                            className="w-12 h-16 rounded-2xl border-2 border-slate-200 text-xl font-bold bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                                        />
                                                    ))}
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleVerify()}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                                        disabled={loading || otp.length !== 6}
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                                        Confirm Identity
                                    </Button>

                                    <button
                                        onClick={() => setStep('email')}
                                        className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors py-2"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Change administrator email
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'login' && (
                            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-slate-50/80 p-6 rounded-3xl border border-slate-100 flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                                        <Lock className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Authenticated Email</p>
                                        <p className="text-lg font-bold text-slate-800">{email}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3 text-center">
                                        <Label className="text-slate-700 font-bold">Authenticator Code</Label>
                                        <div className="flex justify-center py-2">
                                            <InputOTP
                                                maxLength={6}
                                                value={otp}
                                                onChange={(value) => setOtp(value)}
                                                onComplete={() => handleVerify()}
                                                autoFocus
                                            >
                                                <InputOTPGroup className="gap-3">
                                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                            className="w-12 h-16 rounded-2xl border-2 border-slate-200 text-xl font-bold bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                                                        />
                                                    ))}
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleVerify()}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                                        disabled={loading || otp.length !== 6}
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                                        Authorize Access
                                    </Button>

                                    <button
                                        onClick={() => setStep('email')}
                                        className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors py-2"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Switch account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Tagline */}
                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                            Secured Internal Management System
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
