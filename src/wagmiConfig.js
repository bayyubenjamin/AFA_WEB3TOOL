// src/wagmiConfig.js
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// [PENTING] Ganti dengan WalletConnect Project ID Anda sendiri
// Anda bisa mendapatkannya secara gratis dari https://cloud.walletconnect.com/
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
    }),
    injected({ target: 'metaMask' }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // [DIHAPUS] Baris reconnectOnMount: false dihapus agar kembali ke default (true)
});
