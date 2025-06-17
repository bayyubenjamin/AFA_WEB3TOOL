// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/style.css";

import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";

// --- TAMBAHAN UNTUK WALLET ---
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config as wagmiConfig } from './wagmiConfig' // Impor config
const queryClient = new QueryClient()
// --- AKHIR TAMBAHAN ---


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* --- BUNGKUS DENGAN PROVIDER WALLET --- */}
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </WagmiProvider>
      {/* --- AKHIR BUNGKUS --- */}
    </BrowserRouter>
  </React.StrictMode>
);
