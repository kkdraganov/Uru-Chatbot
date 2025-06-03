import React from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../contexts/AuthContext';
import { ChatProvider } from '../contexts/ChatContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  return (
    <AuthProvider>
      <ChatProvider>
        <Component {...pageProps} />
      </ChatProvider>
    </AuthProvider>
  );
}

export default MyApp;
