// src/hooks/useMiniPay.js
import { useState, useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';

export const useMiniPay = () => {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 6; // Coba 6 kali (total 3 detik)

    const checkAndConnect = () => {
      if (!isMounted) return;

      // Cek apakah provider ethereum ada dan memiliki flag isMiniPay
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMiniPay) {
        setIsMiniPay(true);
        console.log("MiniPay Terdeteksi!");
        
        if (!isConnected) {
          // Wagmi kadang menyebutnya 'injected', kadang 'window.ethereum'
          const injectedConnector = connectors.find(
            (c) => c.id === 'injected' || 
                   c.type === 'injected' || 
                   c.name.toLowerCase().includes('injected') || 
                   c.id === 'window.ethereum'
          );
          
          if (injectedConnector) {
            connect({ connector: injectedConnector });
          } else {
             // Jika Wagmi gagal menemukan connector injected, kita beri info di console
            console.warn("Wagmi Injected Connector belum siap.");
          }
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        // Jeda 500ms sebelum mencoba lagi (menangani delay injeksi di mobile)
        setTimeout(checkAndConnect, 500);
      }
    };

    checkAndConnect();

    return () => {
      isMounted = false;
    };
  }, [isConnected, connect, connectors]);

  return {
    isMiniPay,
    isConnected,
    address,
  };
};
