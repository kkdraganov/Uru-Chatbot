import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

declare const process: {
    env: {
        NEXT_PUBLIC_AZURE_CLIENT_ID?: string;
        NEXT_PUBLIC_AZURE_TENANT_ID?: string;
        NEXT_PUBLIC_AZURE_REDIRECT_URI?: string;
        [key: string]: string | undefined;
    };
};

// Microsoft logo SVG component
const MicrosoftLogo = () => (
    <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
        <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
    </svg>
);

export function AzureLoginButton() {
    const { isLoading } = useAuth();
    const [isAzureLoading, setIsAzureLoading] = useState(false);

    // Azure Entra application details
    const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '';
    const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID || '';
    const redirectUri = process.env.NEXT_PUBLIC_AZURE_REDIRECT_URI || 'http://localhost:3000/authorize';

    const handleAzureLogin = () => {
        setIsAzureLoading(true);

        // Construct auth URL - using v2.0 endpoint with proper scope format
        const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${clientId}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_mode=query` +
        `&scope=${encodeURIComponent('https://graph.microsoft.com/User.Read')}` +
        `&state=${Math.random().toString(36).substring(2, 15)}`;

        // Redirect to Microsoft login
        window.location.href = authUrl;
    };

    return (
        <button
            onClick={handleAzureLogin}
            disabled={isLoading || isAzureLoading}
            className={`
                w-full flex items-center justify-center gap-3 px-4 py-3
                bg-[#0066b2] hover:bg-[#005a9e] active:bg-[#004d87]
                text-white font-medium text-sm
                border border-[#0066b2] hover:border-[#005a9e]
                rounded-lg transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0066b2]
                focus:outline-none focus:ring-2 focus:ring-[#0066b2] focus:ring-offset-2
            `}
        >
            {!isAzureLoading && <MicrosoftLogo />}
            {isAzureLoading ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Redirecting...
                </>
            ) : (
                "Sign in with Microsoft"
            )}
        </button>
    );
}