// src/components/PageAfaIdentity.jsx (Versi Final dengan Penanganan Error)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFingerprint, faArrowLeft, faShieldHalved, faIdCard, faSpinner,
  faCheckCircle, faTimesCircle, faWallet, faEnvelope, faCrown, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { supabase } from '../supabaseClient';
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

// GANTI DENGAN ALAMAT KONTRAK BARU DARI HASIL DEPLOY TERAKHIR ANDA
const CONTRACT_ADDRESS = '0x5045c77a154178db4b41b8584830311108124489';


// Komponen untuk setiap item di checklist
const PrerequisiteItem = ({ icon, title, value, isComplete, action, actionLabel, actionDisabled }) => (
  <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-dark-bg/50 rounded-lg transition-all duration-300">
    <div className="flex items-center gap-3">
      <FontAwesomeIcon icon={icon} className={`text-lg w-5 ${isComplete ? 'text-green-400' : 'text-yellow-400'}`} />
      <div>
        <p className="text-sm font-semibold text-light-text dark:text-white">{title}</p>
        {value && <p className="text-xs text-light-subtle dark:text-gray-400 break-all">{value}</p>}
      </div>
    </div>
    {isComplete ? (
      <FontAwesomeIcon icon={faCheckCircle} className="text-xl text-green-400" />
    ) : (
      <button onClick={action} disabled={actionDisabled} className="text-xs bg-accent text-white font-bold px-3 py-1.5 rounded-md hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {actionLabel}
      </button>
    )}
  </div>
);

export default function PageAfaIdentity({ currentUser, onOpenWalletModal }) {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  // State untuk UI dan feedback
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Wagmi hooks
  const { data: hash, writeContract, error: writeError, reset: resetWriteContract } = useWriteContract();
  
  // <-- PERBAIKAN UTAMA: Ambil 'receipt' untuk cek status akhir
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  // -- Cek Status Kepemilikan & Premium NFT --
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'balanceOf', args: [currentUser?.address], enabled: !!currentUser?.address,
  });

  const { data: tokenId, refetch: refetchTokenId } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'tokenOfOwnerByIndex', args: [currentUser?.address, 0], enabled: !!currentUser?.address && balance > 0,
  });

  const { data: isPremium, refetch: refetchPremiumStatus } = useReadContract({
    address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'isPremium', args: [tokenId], enabled: !!tokenId,
  });
  
  const userHasNFT = balance > 0;

  // Cek kelengkapan prasyarat
  const isEmailDummy = currentUser?.email?.endsWith('@wallet.afa-web3.com') || currentUser?.email?.endsWith('@telegram.user');
  const prerequisites = {
    isLoggedIn: !!currentUser?.id,
    walletConnected: !!currentUser?.address && isConnected && currentUser.address.toLowerCase() === address.toLowerCase(),
    telegramConnected: !!currentUser?.telegram_user_id,
    emailSecured: !isEmailDummy,
  };
  const allPrerequisitesMet = Object.values(prerequisites).every(Boolean);

  // <-- PERBAIKAN UTAMA: Efek untuk menangani HASIL transaksi (sukses atau gagal)
  useEffect(() => {
    if (receipt) {
        setIsActionLoading(false); // Selalu hentikan loading saat receipt diterima
        if (receipt.status === 'success') {
            setFeedback({ message: 'Transaksi berhasil! Status Anda akan segera diperbarui.', type: 'success' });
            refetchBalance();
            refetchTokenId();
            refetchPremiumStatus();
        } else {
            setFeedback({ message: 'Transaksi gagal di blockchain. Kemungkinan fungsi belum terdaftar.', type: 'error' });
        }
    }
  }, [receipt, refetchBalance, refetchTokenId, refetchPremiumStatus]);

  // Efek untuk menangani error DARI WALLET (sebelum transaksi dikirim)
  useEffect(() => {
    if (writeError) {
      setFeedback({ message: writeError.shortMessage || 'Transaksi ditolak atau gagal.', type: 'error' });
      setIsActionLoading(false);
    }
  }, [writeError]);


  const handleMint = async () => {
    if (!allPrerequisitesMet) return;
    setFeedback({ message: '', type: '' });
    resetWriteContract();
    setIsActionLoading(true);

    try {
      const { data: signatureData, error: functionError } = await supabase.functions.invoke('generate-mint-signature', {
        body: { userAddress: address },
      });

      if (functionError) throw new Error(functionError.message);
      if (signatureData.error) throw new Error(signatureData.error);
      
      const { signature } = signatureData;

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: AfaIdentityABI,
        functionName: 'mintIdentity',
        args: [signature],
      });
    } catch (err) {
      setFeedback({ message: err.message, type: 'error' });
      setIsActionLoading(false);
    }
  };

  const handleUpgrade = () => {
    alert('Fungsi upgrade ke premium sedang dalam pengembangan!');
  };
  
  const getButtonState = () => {
      const isLoading = isActionLoading || isConfirming;
      if (!prerequisites.isLoggedIn) return { text: "Login untuk Memulai", action: () => navigate('/login'), disabled: false };
      if (!isConnected) return { text: "Connect Wallet", action: onOpenWalletModal, disabled: false };
      if (!allPrerequisitesMet) return { text: "Lengkapi Profil Anda", action: () => navigate('/profile'), disabled: false };
      if (isLoading) return { text: isConfirming ? "Konfirmasi..." : "Menunggu Wallet...", action: ()=>{}, disabled: true};
      if (!userHasNFT) return { text: "Mint Your AFA Identity", action: handleMint, disabled: false };
      if (userHasNFT && !isPremium) return { text: "Upgrade to Premium", action: handleUpgrade, disabled: false };
      if (userHasNFT && isPremium) return { text: "Perpanjang Langganan", action: handleUpgrade, disabled: false };
      return { text: "Loading Status...", action: ()=>{}, disabled: true };
  }

  const buttonState = getButtonState();

  return (
    <section className="page-content py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali ke Beranda
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Kolom Kiri: Visual NFT */}
          <div className="lg:col-span-2 flex justify-center items-center">
            <div className={`w-full max-w-xs aspect-square p-6 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center transition-all duration-300 hover:scale-105
                ${isPremium ? 'bg-yellow-400/10 border-yellow-400/50 shadow-yellow-400/20' : 'bg-dark-card border-primary/20 shadow-primary/20'}
                -rotate-3 hover:rotate-0`}>
              <FontAwesomeIcon icon={isPremium ? faCrown : faFingerprint} className={`text-8xl drop-shadow-[0_5px_15px_rgba(27,77,193,0.4)] ${isPremium ? 'text-yellow-400' : 'text-primary'}`} />
              <h3 className="text-2xl font-bold text-white mt-4">AFA Identity</h3>
              <p className="text-sm text-gray-400">{userHasNFT ? `Token ID: #${tokenId?.toString()}` : 'Not Minted'}</p>
              <div className={`mt-4 font-bold text-xs py-1 px-3 rounded-full
                  ${userHasNFT ? (isPremium ? 'bg-yellow-400/20 text-yellow-300' : 'bg-green-500/20 text-green-300') : 'bg-gray-500/20 text-gray-400'}`}>
                {userHasNFT ? (isPremium ? 'PREMIUM' : 'STANDARD') : 'UNCLAIMED'}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Panel Aksi */}
          <div className="lg:col-span-3">
            <h1 className="text-4xl font-bold futuristic-text-gradient mb-3">Identitas AFA Anda</h1>
            <p className="text-lg text-light-subtle dark:text-gray-400 mb-6">
              Paspor on-chain unik Anda untuk masuk ke ekosistem AFA.
            </p>

            <div className="space-y-3 mb-8 p-4 bg-light-soft dark:bg-dark-card rounded-xl border border-black/10 dark:border-white/10">
              <h3 className="font-bold text-lg text-light-text dark:text-white mb-2">Checklist Minting</h3>
              <PrerequisiteItem icon={faCheckCircle} title="Login ke Akun AFA" isComplete={prerequisites.isLoggedIn} value={currentUser?.email} action={() => navigate('/login')} actionLabel="Login" />
              <PrerequisiteItem icon={faWallet} title="Hubungkan Wallet" isComplete={prerequisites.walletConnected} value={currentUser?.address ? `${currentUser.address.substring(0,6)}...` : 'Belum terhubung'} action={onOpenWalletModal} actionLabel="Hubungkan" />
              <PrerequisiteItem icon={faTelegram} title="Hubungkan Telegram" isComplete={prerequisites.telegramConnected} value={prerequisites.telegramConnected ? 'Terhubung' : 'Belum terhubung'} action={() => navigate('/profile')} actionLabel="Hubungkan" />
              <PrerequisiteItem icon={faEnvelope} title="Amankan dengan Email" isComplete={prerequisites.emailSecured} value={isEmailDummy ? 'Akun belum diamankan' : 'Akun Aman'} action={() => navigate('/profile')} actionLabel="Amankan" />
            </div>
            
            <button onClick={buttonState.action} disabled={buttonState.disabled} className="btn-primary w-full py-4 text-xl rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
              {(isActionLoading || isConfirming) && <FontAwesomeIcon icon={faSpinner} spin />}
              {buttonState.text}
            </button>

            {feedback.message && (
              <div className={`mt-4 text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                <FontAwesomeIcon icon={feedback.type === 'error' ? faTimesCircle : faCheckCircle} />
                <span className="break-all">{feedback.message}</span>
              </div>
            )}

            {hash && (
              <div className="mt-4 text-xs text-center text-light-subtle dark:text-gray-400">
                <a href={`https://sepolia-optimism.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                  Lihat Transaksi di Etherscan
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
