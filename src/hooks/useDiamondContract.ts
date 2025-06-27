

// src/hooks/useDiamondContract.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import DiamondABI from "../contracts/AFAIdentityDiamondABI.json";

const DIAMOND_ADDRESS = "0xfBEFd9b787ab888b2a8A0aa9663c8182E5AC407A";

export function useDiamondContract() {
  const provider = useMemo(() => new ethers.providers.Web3Provider(window.ethereum), []);
  const signer = provider.getSigner();
  return new ethers.Contract(DIAMOND_ADDRESS, DiamondABI, signer);
}

