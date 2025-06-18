// src/wagmiConfig.js
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// [PENTING] Ganti dengan WalletConnect Project ID Anda sendiri
// Anda bisa mendapatkannya secara gratis dari https://cloud.walletconnect.com/
const walletConnectProjectId = '3a2a849d44557c3d79a296d93333604a';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected({
      // Menampilkan opsi untuk dompet browser lain selain MetaMask
      target: 'metaMask', 
    }),
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true, // Menampilkan QR Code secara otomatis
    }),
    coinbaseWallet({
      appName: 'AFA Web3Tool',
      // URL untuk logo aplikasi Anda
      appLogoUrl: 'https://ik.imagekit.io/5spt6gb2z/IMG_2894.jpeg', 
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // [TAMBAHAN] Nonaktifkan reconnect on mount untuk alur modal yang lebih baik
  reconnectOnMount: false,
})
