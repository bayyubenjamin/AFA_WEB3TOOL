// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Font imports
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/baloo-2';
import '@fontsource/quicksand';

// Styles
import "./styles/style.css";

// Components & Contexts
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// Web3 Imports
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config as wagmiConfig, walletConnectProjectId } from './wagmiConfig';

// 1. Inisialisasi Query Client di luar render
const queryClient = new QueryClient();

// 2. Featured Wallets (Opsional)
const featuredWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875DA31A0', // Trust Wallet
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3CFb6b3a38bd033AA', // Coinbase
];

// 3. ROBUST WEB3MODAL INITIALIZATION
// Membungkus ini dalam try-catch sangat penting. Jika projectId salah/kosong,
// fungsi ini biasanya throw error yang mematikan seluruh aplikasi (White Screen).
try {
  if (!walletConnectProjectId) {
    console.warn("⚠️ WalletConnect Project ID is missing. Web3 features may not work.");
  } else {
    createWeb3Modal({
      wagmiConfig: wagmiConfig,
      projectId: walletConnectProjectId,
      featuredWalletIds,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-color-mix': '#0a0a1a',
        '--w3m-color-mix-strength': 20,
        '--w3m-accent': '#7f5af0'
      }
    });
    console.log("✅ Web3Modal initialized successfully");
  }
} catch (error) {
  console.error("❌ Failed to initialize Web3Modal:", error);
  // Aplikasi tetap lanjut render meskipun Web3 gagal
}

// 4. Safe Rendering
const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Critical Error: Root element with id 'root' not found in DOM.");
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          {/* WagmiProvider harus di level teratas untuk hook useAccount dll */}
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider>
                <LanguageProvider>
                   <App />
                </LanguageProvider>
              </ThemeProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
    console.log("🚀 Application mounted successfully");
  } catch (renderError) {
    console.error("❌ Error during React mounting:", renderError);
    // Fallback manual jika React hancur total
    rootElement.innerHTML = `<div style="color:red; padding:20px; text-align:center;">
      <h1>Application Error</h1>
      <p>Gagal memuat aplikasi. Cek console browser untuk detail.</p>
      <pre>${renderError.message}</pre>
    </div>`;
  }
}
