// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base } from 'wagmi/chains';

// Ganti Project ID ini dengan milik Anda dari cloud.walletconnect.com jika masih loading
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570';

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool Platform',
  url: 'https://afatestweb.vercel.app', // Ganti dengan URL website Anda (wajib https)
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [base];

// Gunakan defaultWagmiConfig agar list wallet otomatis ter-load
export const config = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});
