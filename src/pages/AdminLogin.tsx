import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight, QrCode } from 'lucide-react';

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
                // Init setup
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

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Admin Access</CardTitle>
                    <CardDescription>
                        {step === 'email' && 'Enter your admin email to continue'}
                        {step === 'setup' && 'Scan QR Code to setup 2FA'}
                        {step === 'login' && 'Enter TOTP Code from your authenticator app'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'email' && (
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />} Continue
                            </Button>
                        </form>
                    )}

                    {step === 'setup' && qrCodeData && (
                        <div className="space-y-4 text-center">
                            <div className="flex justify-center bg-white p-4 rounded border">
                                <img src={qrCodeData.qrCode} alt="Scan QR" className="w-48 h-48" />
                            </div>
                            <p className="text-sm text-gray-500">Scan this with Google Authenticator</p>

                            <form onSubmit={handleVerify} className="space-y-4 mt-4">
                                <Input
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : 'Verify & Enable'}
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 'login' && (
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <Label>TOTP Code</Label>
                                <Input
                                    placeholder="Enter 6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Login'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
