import { http, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia, optimismSepolia } from 'wagmi/chains'; // [HIGH IMPACT] Gunakan definisi official
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// --- DEFINISI JARINGAN CUSTOM (PHAROS) ---
// Kita define manual karena belum ada di library standar
const pharosTestnet = {
  id: 688688,
  name: 'Pharos Testnet',
  nativeCurrency: { name: 'Pharos', symbol: 'PHAROS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.dplabs-internal.com'] },
  },
  blockExplorers: {
    default: { name: 'Pharosscan', url: 'https://testnet.pharosscan.xyz' },
  },
  testnet: true,
};

export const walletConnectProjectId = '06468097f9a134a428194c7a2e0eb940';

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool - Airdrop For All',
  url: 'https://afatestweb.vercel.app',
  icons: ['https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg']
};

export const config = createConfig({
  // [BASE ECOSYSTEM FOCUS]
  // 1. Urutan sangat penting! Base diletakkan paling depan agar jadi default network.
  // 2. Kita tambahkan 'base' (Mainnet) agar siap production.
  chains: [base, baseSepolia, optimismSepolia, pharosTestnet],

  // [HIGH IMPACT] SSR: true sangat krusial untuk Next.js/Vercel agar tidak error saat reload
  ssr: true, 
  
  connectors: [
    // [BASE OPTIMIZATION] Coinbase Wallet sangat smooth di jaringan Base (Smart Wallet)
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0],
      preference: 'all', // Mendukung Smart Wallet & EOA
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata,
      showQrModal: false,
    }),
    injected({ shimDisconnect: true }),
  ],
  
  // Storage logic aman untuk SSR
  storage: createStorage({  
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, 
  }),

  transports: {
    // Wagmi akan otomatis mencari RPC terbaik untuk chain official (Base/OP)
    // Tapi kita bisa override jika punya API Key Alchemy/Infura untuk performa lebih ngebut
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [optimismSepolia.id]: http(),
    [pharosTestnet.id]: http(),
  },
});
