// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage, http } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, optimism, base, zksync, linea } from 'wagmi/chains'

// Pastikan Project ID ada. Jika tidak, gunakan string kosong untuk mencegah crash impor (meski nanti koneksi gagal)
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570' || 'example_id';

const metadata = {
  name: 'AFA Web3 Dashboard',
  description: 'Comprehensive Web3 Airdrop & Community Management Tool',
  url: 'https://airdropforall.app', 
  icons: ['https://airdropforall.app/assets/logo.png'] 
}

const chains = [mainnet, bsc, polygon, arbitrum, optimism, base, zksync, linea];

// Buat config dengan try-catch block implisit atau default value
let wagmiConfig;

try {
  wagmiConfig = defaultWagmiConfig({
    chains,
    projectId: walletConnectProjectId,
    metadata,
    ssr: true,
    storage: createStorage({
      storage: cookieStorage
    }),
    transports: {
      [mainnet.id]: http(),
      [bsc.id]: http(),
      [polygon.id]: http(),
      [arbitrum.id]: http(),
      [optimism.id]: http(),
      [base.id]: http(),
      [zksync.id]: http(),
      [linea.id]: http(),
    },
    // Opsi auth email dimatikan defaultnya di v5 jika tidak diset
    enableEmail: true 
  });
} catch (error) {
  console.error("Error creating Wagmi Config:", error);
  // Fallback config minimal agar app tidak crash total
  wagmiConfig = defaultWagmiConfig({
    chains,
    projectId: walletConnectProjectId,
    metadata,
  });
}

export const config = wagmiConfig;
