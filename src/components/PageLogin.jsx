// src/components/PageLogin.jsx
import React, { useEffect } from "react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { toast } from 'sonner';

export default function PageLogin({ currentUser }) {
  const { open } = useWeb3Modal();
  const { isConnected, address } = useAccount();
  const navigate = useNavigate();

  // Redirect otomatis jika sudah connect
  useEffect(() => {
    if (isConnected && address) {
      toast.success("Wallet berhasil terhubung!");
      // Beri sedikit delay agar user sadar sudah login
      const timer = setTimeout(() => {
         navigate("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, navigate]);

  const handleConnect = async () => {
    try {
      // open() akan membuka modal. Jangan set loading state manual di sini 
      // karena kita tidak tahu kapan user menutup modal tanpa connect.
      await open(); 
    } catch (err) {
      console.error("Connection failed:", err);
      toast.error("Gagal membuka wallet modal");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 animate-fade-in-up">
      {/* Logo / Header Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
           <FontAwesomeIcon icon={faWallet} className="text-4xl text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Selamat Datang
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Hubungkan wallet Anda untuk mengakses dashboard, airdrop, dan fitur eksklusif AFA Web3Tool.
        </p>
      </div>

      {/* Action Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
        <button
          onClick={handleConnect}
          className="group w-full relative flex items-center justify-between px-6 py-4 bg-[#1a1b1f] hover:bg-[#2d2f36] text-white rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faWallet} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-lg">Connect Wallet</p>
              <p className="text-xs text-gray-400">Metamask, TrustWallet, dll</p>
            </div>
          </div>
          <FontAwesomeIcon 
            icon={faArrowRight} 
            className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" 
          />
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Dengan menghubungkan wallet, Anda menyetujui <br/>
            <span className="text-blue-500 cursor-pointer hover:underline">Syarat & Ketentuan</span> layanan kami.
          </p>
        </div>
      </div>
    </div>
  );
}