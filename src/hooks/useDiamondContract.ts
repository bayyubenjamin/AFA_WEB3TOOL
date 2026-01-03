import { useMemo } from "react";
import { ethers } from "ethers";
import DiamondABI from "../contracts/AFAIdentityDiamondABI.json";

// Mengambil address dari environment variable untuk keamanan
// Fallback ke address hardcoded hanya jika env tidak terbaca (untuk development)
const DIAMOND_ADDRESS = import.meta.env.VITE_DIAMOND_ADDRESS || "0x8611E3C3F991C989fEF0427998062f77c9D0A2F1";

export function useDiamondContract() {
  const provider = useMemo(() => {
    // Safety check: Memastikan window.ethereum ada sebelum inisialisasi
    // Ini mencegah error "undefined" pada browser mobile atau non-web3
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    console.warn("Web3 Provider not found. Please install MetaMask or open in Web3 browser.");
    return null;
  }, []);

  // Jika provider tidak ada, kembalikan null agar komponen UI bisa menangani state
  if (!provider) return null;

  try {
    const signer = provider.getSigner();
    return new ethers.Contract(DIAMOND_ADDRESS, DiamondABI, signer);
  } catch (error) {
    console.error("Failed to initialize contract:", error);
    return null;
  }
}