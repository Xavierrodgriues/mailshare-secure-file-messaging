import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SignatureSettings() {
    const { user } = useAuth();
    const [signature, setSignature] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSignature = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('signature')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data && data.signature) {
                    setSignature(data.signature);
                } else {
                    setSignature(DEFAULT_SIGNATURE);
                }
            } catch (error) {
                console.error('Error fetching signature:', error);
                toast.error('Failed to load signature');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSignature();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ signature })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Signature saved successfully');
        } catch (error) {
            console.error('Error saving signature:', error);
            toast.error('Failed to save signature');
        } finally {
            setIsSaving(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ];

    const DEFAULT_SIGNATURE = `
<p>--</p>
<p>Regards,</p>
<p><img src="/signature.png" alt="Logo" width="100"></p>
<br>
<p><strong>Your Name || Your Role</strong></p>
<p><strong>a:</strong> Yuvii Consultancy LLC |133 Centennial Ridge DR, Acworth GA,30102  | United States</p>
<p><strong>e:</strong> your_email@yuviiconsultancy.com | <strong>w:</strong> <a href="http://www.yuviiconsultancy.com" target="_blank" rel="noopener noreferrer">www.yuviiconsultancy.com</a></p>
<p><strong>M:</strong> Phone Number</p>
`;

    const handleLoadDefault = () => {
        if (window.confirm('This will replace your current signature. Continue?')) {
            setSignature(DEFAULT_SIGNATURE);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Signature</h3>
                <p className="text-sm text-muted-foreground">
                    Create a signature that will be automatically added to your emails.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Signature</CardTitle>
                        <CardDescription>
                            Design your email signature using the editor below. You can include images and formatting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Signature Content</Label>
                            <div className="bg-background">
                                <ReactQuill
                                    theme="snow"
                                    value={signature}
                                    onChange={setSignature}
                                    modules={modules}
                                    formats={formats}
                                    className="h-64 mb-12"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={handleLoadDefault}>
                                Load Default Template
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Signature'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {signature && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md p-4 bg-muted/30">
                                <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: signature }} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
