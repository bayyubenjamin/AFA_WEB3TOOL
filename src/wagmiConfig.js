// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base } from 'wagmi/chains';
// PERBAIKAN: Impor dari @stacks/network dengan cara ini
import { StacksMainnet } from '@stacks/network'; 

// Ganti Project ID ini dengan milik Anda dari cloud.walletconnect.com jika masih loading
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570';

// Inisialisasi Network Stacks
// Jika StacksMainnet tetap error, coba gunakan: new StacksMainnet() 
// atau pastikan versi @stacks/network Anda sudah benar
export const stacksNetwork = new StacksMainnet();

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool Platform',
  url: 'https://afatestweb.vercel.app', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [base];

export const config = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});
