// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/style.css";

import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// --- [MODIFIKASI] UNTUK WALLET ---
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config as wagmiConfig, walletConnectProjectId } from './wagmiConfig' // Impor config & projectId
// --- AKHIR MODIFIKASI ---

const queryClient = new QueryClient()

// --- [DITAMBAHKAN] Inisialisasi Web3Modal ---
createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId: walletConnectProjectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#0a0a1a',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#7f5af0'
  }
})
// --- AKHIR TAMBAHAN ---

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
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
