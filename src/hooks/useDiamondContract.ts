// src/hooks/useDiamondContract.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import DiamondABI from "../contracts/AFAIdentityDiamondABI.json";

const DIAMOND_ADDRESS = "0x5045c77a154178db4b41b8584830311108124489";

export function useDiamondContract() {
  const provider = useMemo(() => new ethers.providers.Web3Provider(window.ethereum), []);
  const signer = provider.getSigner();
  return new ethers.Contract(DIAMOND_ADDRESS, DiamondABI, signer);
}

