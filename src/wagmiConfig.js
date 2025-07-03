import { http, createConfig, createStorage } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// =============================================================================
// 1. Definisikan OBJEK untuk SETIAP JARINGAN yang didukung
// =============================================================================

const optimismSepolia = {
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.optimism.io'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia-optimism.etherscan.io' },
  },
  testnet: true,
};

// --- TAMBAHKAN DEFINISI UNTUK BASE SEPOLIA ---
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

// =============================================================================
// 2. Konfigurasi wagmi
// =============================================================================

export const walletConnectProjectId = '06468097f9a134a428194c7a2e0eb940';

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool - Airdrop For All',
  url: 'https://afatestweb.vercel.app',
  icons: ['https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg']
};

export const config = createConfig({
  // --- TAMBAHKAN baseSepolia KE DALAM ARRAY chains ---
  chains: [optimismSepolia, baseSepolia],

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

  // --- TAMBAHKAN transport UNTUK baseSepolia ---
  transports: {
    [optimismSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});
