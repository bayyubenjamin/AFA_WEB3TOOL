// src/hooks/useDiamondContract.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import DiamondABI from "../contracts/AFAIdentityDiamondABI.json";

const DIAMOND_ADDRESS = "0x102dA6B04621114dc25CB1dcc0C3e7EF70678c93";

export function useDiamondContract() {
  const provider = useMemo(() => new ethers.providers.Web3Provider(window.ethereum), []);
  const signer = provider.getSigner();
  return new ethers.Contract(DIAMOND_ADDRESS, DiamondABI, signer);
}

