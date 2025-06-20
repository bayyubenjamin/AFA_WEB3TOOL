// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/style.css";

import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// --- Konfigurasi Wallet ---
import { createWeb3Modal } from '@web3modal/wagmi/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config as wagmiConfig, walletConnectProjectId } from './wagmiConfig'

const queryClient = new QueryClient()

// [PERBAIKAN FINAL] Menambahkan daftar wallet secara manual.
// Ini untuk mengatasi masalah di mana daftar wallet dari server WalletConnect tidak termuat.
const featuredWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875DA31A0', // Trust Wallet
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3CFb6b3a38bd033AA', // Coinbase Wallet
  '8a0ee50d1f22f6661afbab629e501d12791967911b96a8175A2da456ed12c969', // OKX Wallet
  '1ae92b26df02f0ABC630420F30a8C928049a9DE970E340E3053D50C209AE990A', // Rainbow
];

// Inisialisasi Web3Modal
createWeb3Modal({
  wagmiConfig: wagmiConfig,
  projectId: walletConnectProjectId,
  // [PERBAIKAN FINAL] Tambahkan ID wallet yang ingin Anda tampilkan di sini
  featuredWalletIds,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#0a0a1a',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#7f5af0'
  }
})

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
