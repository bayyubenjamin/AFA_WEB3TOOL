// src/hooks/useMiniPay.js
import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';

export const useMiniPay = () => {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    // MiniPay menginjeksi provider Ethereum ke window, kita cek keberadaannya
    const checkAndConnectMiniPay = () => {
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMiniPay) {
        setIsMiniPay(true);
        console.log("Menjalankan aplikasi di dalam MiniPay!");

        // Persyaratan utama MiniPay: Harus auto-connect saat dimuat
        if (!isConnected) {
          // Cari connector 'injected' bawaan karena MiniPay adalah injected wallet
          const injectedConnector = connectors.find(
            (c) => c.id === 'injected' || c.type === 'injected' || c.name.toLowerCase().includes('injected')
          );
          
          if (injectedConnector) {
            connect({ connector: injectedConnector });
          }
        }
      }
    };

    checkAndConnectMiniPay();
  }, [isConnected, connect, connectors]);

  return {
    isMiniPay,
    isConnected,
    address,
  };
};
