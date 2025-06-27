

// src/hooks/useDiamondContract.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import DiamondABI from "../contracts/AFAIdentityDiamondABI.json";

const DIAMOND_ADDRESS = "0x8611E3C3F991C989fEF0427998062f77c9D0A2F1";

export function useDiamondContract() {
  const provider = useMemo(() => new ethers.providers.Web3Provider(window.ethereum), []);
  const signer = provider.getSigner();
  return new ethers.Contract(DIAMOND_ADDRESS, DiamondABI, signer);
}

