import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { cookieStorage, createStorage, http } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, optimism, base, zksync, linea } from 'wagmi/chains'
import { walletConnect, coinbaseWallet, injected } from 'wagmi/connectors'

// 1. Get projectId at https://cloud.walletconnect.com
// Menggunakan Project ID existing atau public
export const walletConnectProjectId = '4d85918712392765b2e95a0448100570'

// 2. Create wagmiConfig
const metadata = {
  name: 'AFA Web3 Dashboard',
  description: 'Comprehensive Web3 Airdrop & Community Management Tool',
  url: 'https://airdropforall.app', 
  icons: ['https://airdropforall.app/assets/logo.png'] 
}

// Chain configurations 
const chains = [mainnet, bsc, polygon, arbitrum, optimism, base, zksync, linea]

export const config = defaultWagmiConfig({
  chains,
  projectId: walletConnectProjectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [zksync.id]: http(),
    [linea.id]: http(),
  },
  connectors: [
    walletConnect({ 
      projectId: walletConnectProjectId, 
      metadata, 
      showQrModal: false 
    }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({
      appName: metadata.name,
      appLogoUrl: metadata.icons[0]
    })
  ]
})
