import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

export const useBaseNetwork = () => {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { isConnected } = useAccount();

  const isWrongNetwork = isConnected && chain?.id !== 8453; // 8453 is Base ID

  const switchToBase = () => {
    if (switchNetwork) {
      switchNetwork(8453);
    }
  };

  return {
    isWrongNetwork,
    currentChainId: chain?.id,
    switchToBase
  };
};
