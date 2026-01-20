import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email')
    .refine(
      (email) => email.endsWith('@yuviiconsultancy.com') || email.endsWith('@yuviiconsultancy.internal'),
      { message: 'Email should be @yuviiconsultancy.com or @yuviiconsultancy.internal' }
    ),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);


const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function Auth() {
  const { user, signUp, signIn, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkMaintenance();
  }, []);

  const checkMaintenance = async () => {
    try {
      const response = await fetch('https://mailshare-admin-api.onrender.com/api/settings/public');
      const data = await response.json();
      setMaintenanceMode(!!data.maintenanceMode);
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final check for maintenance mode before processing
    try {
      const resp = await fetch('https://mailshare-admin-api.onrender.com/api/settings/public');
      const settingsData = await resp.json();
      if (settingsData.maintenanceMode) {
        setMaintenanceMode(true);
        toast.error('Access restricted: System is currently under maintenance.');
        return;
      }
    } catch (err) {
      console.error('Submit maintenance check failed:', err);
    }

    setLoading(true);

    try {
      if (isLogin) {
        const validation = signInSchema.safeParse(formData);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const validation = signUpSchema.safeParse(formData);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('An account with this email already exists');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex items-center justify-center mb-8">
            <img
              src="/yuvii-logo.jpeg"
              alt="Yuvii"
              className="h-20 w-auto object-contain rounded-xl shadow-lg"
            />
          </div>
          <p className="text-xl font-medium mb-4">
            Simple, secure messaging with file sharing
          </p>
          <p className="text-primary-foreground/80">
            Send messages and share files with your team. Clean interface, powerful features.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-lg animate-fade-in">
          <CardHeader className="space-y-1 pb-6">
            <div className="lg:hidden flex items-center justify-center mb-6">
              <img
                src="/yuvii-logo.jpeg"
                alt="Yuvii"
                className="h-16 w-auto object-contain rounded-lg"
              />
            </div>
            <CardTitle className="text-2xl font-display">
              {maintenanceMode ? 'System Maintenance' : (isLogin ? 'Welcome back' : 'Create an account')}
            </CardTitle>
            <CardDescription>
              {maintenanceMode
                ? 'The system is currently undergoing scheduled maintenance. Please try again later.'
                : (isLogin ? 'Enter your credentials to access your inbox' : 'Fill in your details to get started')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceMode ? (
              <div className="py-6 text-center space-y-4">
                <div className="bg-rose-50 p-4 rounded-2xl flex items-center justify-center">
                  <Lock className="h-10 w-10 text-rose-500 animate-pulse" />
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  We apologize for the inconvenience. Our team is working to improve your experience.
                </p>
                <Button
                  onClick={async () => {
                    const t = toast.loading('Checking system status...');
                    await checkMaintenance();
                    setTimeout(() => {
                      toast.dismiss(t);
                      toast.success('System status synchronized');
                    }, 800);
                  }}
                  variant="outline"
                  className="w-full rounded-2xl h-12 font-bold"
                >
                  Check Portal Status
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          className="pl-10"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isLogin
                      ? "Don't have an account? Sign up"
                      : 'Already have an account? Sign in'}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
