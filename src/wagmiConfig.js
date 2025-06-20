// src/wagmiConfig.js
import { http, createConfig, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const walletConnectProjectId = '3a2a849d44557c3d79a296d93333604a';

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool - Airdrop For All',
  url: 'https://afatestweb.vercel.app',
  icons: ['https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg']
};

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    walletConnect({
      projectId: walletConnectProjectId,
      metadata,
      // [PERBAIKAN PENTING] Web3Modal menangani tampilan QR, jadi ini harus false untuk menghindari konflik.
      showQrModal: false,
    }),
    // [PERBAIKAN PENTING] Konfigurasi ini lebih umum untuk mendeteksi berbagai wallet browser (MetaMask, Brave, dll).
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
