// src/hooks/useDiamondContract.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import DiamondABI from "../contracts/AFAIdentityDiamondABI.json";

const DIAMOND_ADDRESS = "0xce6FbcB9337C39eA5DFfE44ABD8b5d35bfD0f684";

export function useDiamondContract() {
  const provider = useMemo(() => new ethers.providers.Web3Provider(window.ethereum), []);
  const signer = provider.getSigner();
  return new ethers.Contract(DIAMOND_ADDRESS, DiamondABI, signer);
}

