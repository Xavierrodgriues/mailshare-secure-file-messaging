import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear any tokens if stored
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                    <Button variant="outline" onClick={handleLogout}>Logout</Button>
                </div>

                <div className="bg-white p-12 rounded-lg shadow-sm text-center">
                    <h2 className="text-3xl font-bold text-primary mb-4">Welcome Admin</h2>
                    <p className="text-gray-600">You have successfully authenticated via TOTP.</p>
                </div>
            </div>
        </div>
    );
}
