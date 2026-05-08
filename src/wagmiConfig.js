// src/wagmiConfig.js
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base, celo } from 'wagmi/chains'; // Tambahkan celo di sini

import * as StacksNetwork from '@stacks/network';

export const walletConnectProjectId = '4d85918712392765b2e95a0448100570';

export const stacksNetwork = StacksNetwork.StacksMainnet 
  ? new StacksNetwork.StacksMainnet() 
  : StacksNetwork.HIRO_MAINNET;

const metadata = {
  name: 'AFA Web3Tool',
  description: 'AFA Web3Tool Platform',
  url: 'https://afatestweb.vercel.app', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Tambahkan celo ke dalam array chains
const chains = [base, celo]; 

export const config = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});
