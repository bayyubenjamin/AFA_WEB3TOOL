import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import AfaIdentityABI from "../contracts/AFAIdentityDiamondABI.json";

const MAX_TOKEN_ID = 100; // update sesuai jumlah max NFT

export function useUserTokenId(address, contractAddress, userHasNFT) {
  const [tokenId, setTokenId] = useState(null);
  const [isFetchingTokenId, setIsFetchingTokenId] = useState(false);

  // Cek apakah contract punya fungsi tokenOfOwnerByIndex (via ABI)
  const hasTokenOfOwnerByIndex = AfaIdentityABI.some(
    fn => fn.name === "tokenOfOwnerByIndex"
  );

  // Wagmi read untuk tokenOfOwnerByIndex
  const { data: tokenIdDirect } = useReadContract({
    address: contractAddress,
    abi: AfaIdentityABI,
    functionName: "tokenOfOwnerByIndex",
    args: [address, 0],
    enabled: !!address && !!userHasNFT && hasTokenOfOwnerByIndex,
  });

  useEffect(() => {
    if (hasTokenOfOwnerByIndex && tokenIdDirect) {
      setTokenId(Number(tokenIdDirect));
      setIsFetchingTokenId(false);
      return;
    }

    // Fallback: loop ownerOf
    let canceled = false;
    async function findTokenId() {
      if (!address || !userHasNFT) return;
      setIsFetchingTokenId(true);
      for (let i = 1; i <= MAX_TOKEN_ID; i++) {
        try {
          const { data: owner } = await useReadContract({
            address: contractAddress,
            abi: AfaIdentityABI,
            functionName: "ownerOf",
            args: [i],
          });
          if (owner && owner.toLowerCase() === address.toLowerCase()) {
            if (!canceled) setTokenId(i);
            break;
          }
        } catch (e) {/* ignore */}
      }
      setIsFetchingTokenId(false);
    }
    if (!hasTokenOfOwnerByIndex && userHasNFT) findTokenId();
    return () => {
      canceled = true;
    };
  }, [address, contractAddress, userHasNFT, hasTokenOfOwnerByIndex, tokenIdDirect]);

  return { tokenId, isFetchingTokenId };
}
