// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base } from 'wagmi/chains';

// 1. Ganti dengan Project ID Anda dari cloud.walletconnect.com
// Jika string kosong, modal akan loading selamanya atau error
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570'; 

// 2. Metadata Project (Wajib agar tidak dianggap spam oleh wallet)
const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool Platform',
  url: 'https://afa-web3tool.vercel.app', // Ganti dengan URL produksi Anda
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [base];

// 3. Gunakan defaultWagmiConfig untuk setup otomatis
export const config = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId,
  metadata,
  enableWalletConnect: true, // Optional - true by default
  enableInjected: true, // Optional - true by default
  enableEIP6963: true, // Optional - true by default
  enableCoinbase: true, // Optional - true by default
});
