import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const AuthorizePage: React.FC = () => {
    const router = useRouter();
    const { azureLogin } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        // Only run once router is ready and we have query params
        if (!router.isReady) return;

        const handleAuth = async () => {
            const { code, error: authError } = router.query;

            if (authError) {
                setError(`Authentication error: ${authError}`);
                setIsProcessing(false);
                return;
            }

            if (!code || typeof code !== 'string') {
                setError('No authorization code received');
                setIsProcessing(false);
                return;
            }

            try {
                const success = await azureLogin(code);
                if (success) {
                    router.push('/chat');
                } else {
                    setError('Failed to authenticate with Microsoft');
                }
            } catch (err) {
                console.error('Azure login error:', err);
                setError('An unexpected error occurred during authentication');
            } finally {
                setIsProcessing(false);
            }
        };

        handleAuth();
    }, [router.isReady, router.query, azureLogin, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {isProcessing ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Authenticating with Microsoft...</p>
                </div>
            ) : error ? (
                <div className="text-red-500 text-center max-w-md">
                    <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Return to Login
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default AuthorizePage;