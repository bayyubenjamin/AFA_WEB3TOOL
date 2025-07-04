import { http, createConfig, createStorage } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
// Impor 'base' langsung dari wagmi untuk kemudahan
import { base } from 'wagmi/chains';

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
  // --- EDIT: Tambahkan 'base' (Mainnet) ke dalam array chains ---
  chains: [base, optimismSepolia, baseSepolia],

  connectors: [
    walletConnect({
      projectId: walletConnectProjectId,
      metadata,
      showQrModal: false,
    }),
    injected({ shimDisconnect: true }),
    // --- EDIT: Modifikasi coinbaseWallet untuk Smart Wallet ---
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
      // Baris ini akan memprioritaskan pembuatan/koneksi ke Smart Wallet
      preference: 'smartWalletOnly', 
    }),
  ],
  storage: createStorage({ storage: window.localStorage }),

  // --- EDIT: Tambahkan transport untuk 'base' (Mainnet) ---
  transports: {
    [base.id]: http(),
    [optimismSepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});
