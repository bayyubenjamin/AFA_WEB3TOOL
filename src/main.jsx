// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

// Stacks Imports
import { Connect } from '@stacks/connect-react';

// Font imports
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/baloo-2';
import '@fontsource/quicksand';

import "./styles/style.css";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Web3 Imports
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config as wagmiConfig, walletConnectProjectId } from './wagmiConfig';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#333', fontFamily: 'sans-serif' }}>
          <FontAwesomeIcon icon={faTriangleExclamation} size="3x" style={{color: '#ef4444', marginBottom: '1rem'}} />
          <h1>Oops! Aplikasi Gagal Memuat.</h1>
          <p>Terjadi kesalahan kritis pada sistem.</p>
          <pre style={{ background: '#f3f4f6', padding: '10px', borderRadius: '5px', overflow: 'auto', textAlign: 'left', margin: '20px auto', maxWidth: '600px', fontSize: '12px' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Muat Ulang Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

try {
  if (walletConnectProjectId) {
    createWeb3Modal({
      wagmiConfig,
      projectId: walletConnectProjectId,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-color-mix': '#0a0a1a',
        '--w3m-color-mix-strength': 20,
        '--w3m-accent': '#7f5af0'
      }
    });
  }
} catch (error) {
  console.error("Warning: Web3Modal init failed (Check Project ID)", error);
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            {/* Wrapper Connect untuk Stacks Wallet */}
            <Connect
              authOptions={{
                appDetails: {
                  name: 'AFA Web3Tool',
                  icon: 'https://avatars.githubusercontent.com/u/37784886',
                },
                redirectTo: '/',
                onFinish: () => {
                  window.location.reload();
                },
                userSession: null // Secara default akan mengelola session sendiri jika null
              }}
            >
              <ThemeProvider>
                <LanguageProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </LanguageProvider>
              </ThemeProvider>
            </Connect>
          </QueryClientProvider>
        </WagmiProvider>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
