import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"; 

const API_URL = 'http://localhost:5000/api/admin/auth';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'setup' | 'login'>('email');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [qrCodeData, setQrCodeData] = useState<{ secret: string; qrCode: string } | null>(null);

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
                toast.error('Unexpected response');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otp.length !== 6) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token: otp }),
            });
            const data = await res.json();

            if (data.status === 'success') {
                localStorage.setItem('adminToken', data.token);
                toast.success('Login Successful');
                navigate('/admin/dashboard');
            } else {
                toast.error('Invalid OTP');
            }
        } catch (error) {
            toast.error('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EBF5FF] p-4">
            <Card className="w-full max-w-md border-none shadow-lg rounded-[24px] overflow-hidden">
                <CardContent className="pt-10 pb-12 px-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-[#F8FAFC] p-4 rounded-xl mb-6">
                            <img src="/yuvii-logo.png" alt="Yuvii Logo" className="h-12 w-auto" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1E293B] mb-2">Admin Access</h1>

                        {step === 'login' && (
                            <div className="text-center">
                                <p className="text-[#64748B] text-sm">
                                    Login as <span className="font-semibold text-[#1E293B]">{email}</span>
                                </p>
                                <button
                                    onClick={() => setStep('email')}
                                    className="text-[#3B82F6] text-sm hover:underline mt-1"
                                >
                                    Change Email
                                </button>
                            </div>
                        )}
                        {step === 'setup' && (
                            <p className="text-[#64748B] text-sm text-center">
                                Scan QR Code to setup 2FA
                            </p>
                        )}
                        {step === 'email' && (
                            <p className="text-[#64748B] text-sm text-center">
                                Enter your admin email to continue
                            </p>
                        )}
                    </div>

                    {step === 'email' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[#1E293B] font-semibold">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-12 rounded-xl border-[#E2E8F0] focus:border-[#3B82F6] focus:ring-[#3B82F6]"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 !bg-[#3B82F6] hover:!bg-[#2563EB] text-white font-bold rounded-xl transition-all disabled:opacity-80"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    )}

                    {step === 'setup' && qrCodeData && (
                        <div className="space-y-6 text-center">
                            <div className="flex justify-center bg-white p-4 rounded-xl border border-[#E2E8F0]">
                                <img src={qrCodeData.qrCode} alt="Scan QR" className="w-48 h-48" />
                            </div>
                            <p className="text-xs text-[#94A3B8]">Scan this with Google Authenticator or any TOTP app</p>

                            <div className="space-y-4">
                                <div className="space-y-2 text-left">
                                    <Label className="text-[#1E293B] font-semibold">Verification Code</Label>
                                    <div className="flex justify-center">
                                        <InputOTP
                                            maxLength={6}
                                            value={otp}
                                            onChange={(value) => setOtp(value)}
                                            onComplete={() => handleVerify()}
                                            autoFocus
                                        >
                                            <InputOTPGroup className="gap-2">
                                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                                    <InputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className="w-12 h-14 rounded-xl border-[#E2E8F0] text-lg font-bold"
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleVerify()}
                                    className="w-full h-12 !bg-[#3B82F6] hover:!bg-[#2563EB] text-white font-bold rounded-xl transition-all disabled:opacity-80"
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Verify & Enable
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'login' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#1E293B] font-semibold">Authenticator Code</Label>
                                    <div className="flex justify-center">
                                        <InputOTP
                                            maxLength={6}
                                            value={otp}
                                            onChange={(value) => setOtp(value)}
                                            onComplete={() => handleVerify()}
                                            autoFocus
                                        >
                                            <InputOTPGroup className="gap-2">
                                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                                    <InputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className="w-11 h-14 rounded-xl border-[#E2E8F0] text-lg font-bold focus:ring-[#3B82F6]"
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                </div>

                                {/* <Button

                                    onClick={() => handleVerify()}
                                    className="w-full h-12 !bg-[#3B82F6] hover:!bg-[#2563EB] text-white font-bold rounded-xl transition-all disabled:opacity-80"
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Login <ArrowRight className="ml-2 h-4 w-4" />
                                </Button> */}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
