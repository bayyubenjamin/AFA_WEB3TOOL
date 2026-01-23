// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage, http } from 'wagmi'
import { base } from 'wagmi/chains' // Hanya import Base

// Pastikan Project ID ada.
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570' || 'example_id';

const metadata = {
  name: 'AFA Web3 Dashboard',
  description: 'Comprehensive Web3 Airdrop & Community Management Tool',
  url: 'https://airdropforall.app', 
  icons: ['https://airdropforall.app/assets/logo.png'] 
}

// Hanya masukkan base ke dalam array chains
const chains = [base];

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
      // Hanya definisikan transport untuk Base
      [base.id]: http(),
    },
    enableEmail: true 
  });
} catch (error) {
  console.error("Error creating Wagmi Config:", error);
  // Fallback config
  wagmiConfig = defaultWagmiConfig({
    chains,
    projectId: walletConnectProjectId,
    metadata,
  });
}

export const config = wagmiConfig;
