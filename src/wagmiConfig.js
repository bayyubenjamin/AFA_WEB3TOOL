// src/wagmiConfig.js
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, sepolia], // Anda bisa menambahkan chain lain seperti Polygon, BSC, dll.
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
