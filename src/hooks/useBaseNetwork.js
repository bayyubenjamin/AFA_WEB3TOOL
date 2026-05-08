// src/hooks/useBaseNetwork.js (atau buat useCeloNetwork.js)
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

export const useBaseNetwork = () => {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { isConnected } = useAccount();

  const isWrongNetwork = isConnected && chain?.id !== 8453;
  // Tambahan untuk Celo (ID Celo adalah 42220)
  const isNotCelo = isConnected && chain?.id !== 42220;

  const switchToBase = () => {
    if (switchNetwork) {
      switchNetwork(8453);
    }
  };

  const switchToCelo = () => {
    if (switchNetwork) {
      switchNetwork(42220); // ID Jaringan Celo Mainnet
    }
  };

  return {
    isWrongNetwork,
    isNotCelo,
    currentChainId: chain?.id,
    switchToBase,
    switchToCelo
  };
};
