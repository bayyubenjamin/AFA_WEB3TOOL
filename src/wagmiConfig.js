// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base } from 'wagmi/chains';

// PERBAIKAN: Gunakan impor namespace untuk menghindari error "not exported"
import * as StacksNetwork from '@stacks/network';

// Ganti Project ID ini dengan milik Anda dari cloud.walletconnect.com jika masih loading
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570';

/**
 * Inisialisasi Network Stacks.
 * Kita mengambil class StacksMainnet dari namespace StacksNetwork.
 * Jika StacksMainnet tidak ada, kita fallback ke HIRO_MAINNET (standar baru Hiro).
 */
export const stacksNetwork = StacksNetwork.StacksMainnet 
  ? new StacksNetwork.StacksMainnet() 
  : StacksNetwork.HIRO_MAINNET;

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool Platform',
  url: 'https://afatestweb.vercel.app', 
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
