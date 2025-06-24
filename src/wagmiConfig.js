// src/wagmiConfig.js (Perbaikan Final dengan Definisi Manual)

import { http, createConfig, createStorage } from 'wagmi';
// Hapus impor chain dari sini karena kita akan definisikan manual
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// --- DEFINISIKAN BASE SEPOLIA SECARA MANUAL ---
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};
// -------------------------------------------

export const walletConnectProjectId = '06468097f9a134a428194c7a2e0eb940';

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool - Airdrop For All',
  url: 'https://afatestweb.vercel.app',
  icons: ['https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg']
};

export const config = createConfig({
  chains: [baseSepolia], // <-- Sekarang menggunakan konstanta yang kita buat di atas
  connectors: [
    walletConnect({
      projectId: walletConnectProjectId,
      metadata,
      showQrModal: false,
    }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [baseSepolia.id]: http(), // <-- Menggunakan ID dari konstanta yang kita buat
  },
});
