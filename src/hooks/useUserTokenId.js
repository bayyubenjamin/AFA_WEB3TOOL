import { useReadContract, useAccount } from 'wagmi';
import { afaIdentityAddress } from '../contracts';
import DiamondABI from '../contracts/AFAIdentityDiamondABI.json';

export const useUserTokenId = () => {
  const { address, isConnected } = useAccount();

  // Membaca 'tokenIdOf' atau fungsi serupa di Smart Contract Anda
  // Asumsi fungsi di kontrak bernama 'tokenIdOf' atau 'getTokenId'
  // Sesuaikan 'functionName' dengan nama fungsi asli di ABI/Kontrak Anda
  const { data: tokenId, isError, isLoading, refetch } = useReadContract({
    address: afaIdentityAddress,
    abi: DiamondABI,
    functionName: 'tokenIdOf', // Pastikan nama fungsi ini benar di ABI
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected, // Hanya jalan jika wallet connect
    }
  });

  return {
    tokenId: tokenId ? tokenId.toString() : null,
    hasIdentity: !!tokenId && tokenId.toString() !== '0',
    loading: isLoading,
    error: isError,
    refetch
  };
};
