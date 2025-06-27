import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFingerprint, faArrowLeft, faSpinner,
  faCheckCircle, faTimesCircle, faWallet, faEnvelope, faCrown
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import {
  useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt
} from 'wagmi';
// PERBAIKAN 1: Impor ethers untuk menggunakan fungsi formatEther
import { ethers } from 'ethers'; 
import { supabase } from '../supabaseClient';
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

const CONTRACT_ADDRESS = '0xfBEFd9b787ab888b2a8A0aa9663c8182E5AC407A';

// PERBAIKAN 2: Mendefinisikan ABI untuk fungsi baru `priceInWei`
const PriceInWeiABI = [
  {
    "inputs": [],
    "name": "priceInWei", // Menggunakan nama fungsi yang baru
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Komponen PrerequisiteItem tidak berubah
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

function replacerBigInt(key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

export default function PageAfaIdentity({ currentUser, onOpenWalletModal }) {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  // State
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(null); // Akan menyimpan harga dalam Wei
  const [debugLog, setDebugLog] = useState('');
  const [tokenId, setTokenId] = useState(undefined);
  const [identityDebug, setIdentityDebug] = useState('');

  // Wagmi hooks
  const { data: hash, writeContract, error: writeError, reset: resetWriteContract } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'balanceOf',
    args: [currentUser?.address],
    enabled: !!currentUser?.address,
  });

  // PERBAIKAN 3: Membaca harga dari fungsi `priceInWei` menggunakan ABI yang baru
  const { data: rawPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PriceInWeiABI,       // Menggunakan ABI Wei
    functionName: 'priceInWei', // Menggunakan nama fungsi Wei
    enabled: true,
  });

  useEffect(() => {
    // rawPrice dari useReadContract akan berupa BigInt
    if (rawPrice !== undefined && rawPrice !== null) setPremiumPrice(rawPrice);
  }, [rawPrice]);

  useEffect(() => {
    setDebugLog(prev => prev + `\n[DEBUG] premiumPrice (Wei): ${premiumPrice}`);
  }, [premiumPrice]);

  const userHasNFT = !!balance && Number(balance) > 0;

  // Prasyarat tidak berubah
  const isEmailDummy = currentUser?.email?.endsWith('@wallet.afa-web3.com') || currentUser?.email?.endsWith('@telegram.user');
  const prerequisites = {
    isLoggedIn: !!currentUser?.id,
    walletConnected: !!currentUser?.address && isConnected && currentUser.address.toLowerCase() === address?.toLowerCase(),
    telegramConnected: !!currentUser?.telegram_user_id,
    emailSecured: !isEmailDummy,
  };
  const allPrerequisitesMet = Object.values(prerequisites).every(Boolean);

  // Logika pengambilan TokenId tidak berubah
  const { data: wagmiTokenId, isLoading: isFetchingTokenId, error: tokenIdError, refetch: refetchTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [currentUser?.address, 0],
    enabled: !!currentUser?.address && userHasNFT,
  });

  const { data: identityObj, error: getIdentityError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'getIdentity',
    args: [currentUser?.address],
    enabled: !!currentUser?.address,
  });

  useEffect(() => {
    let identityLog = '';
    try { identityLog = JSON.stringify(identityObj, replacerBigInt, 2); } catch (e) { identityLog = String(identityObj); }
    setIdentityDebug(identityLog);
    let id = wagmiTokenId !== undefined && wagmiTokenId !== null ? wagmiTokenId : (identityObj && ((Array.isArray(identityObj) && identityObj[0] !== undefined && identityObj[0] !== "0" && identityObj[0] !== 0) || (typeof identityObj.tokenId === "bigint" && identityObj.tokenId > 0) || (typeof identityObj.tokenId === "number" && identityObj.tokenId > 0) || (typeof identityObj.tokenId === "string" && identityObj.tokenId !== "0" && identityObj.tokenId !== "")) ) ? ( Array.isArray(identityObj) ? identityObj[0] : identityObj.tokenId ) : undefined;
    setTokenId(id);
  }, [wagmiTokenId, identityObj]);

  const { data: isPremium, refetch: refetchPremiumStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'isPremium',
    args: [tokenId],
    enabled: !!tokenId,
  });

  // Debug log tidak berubah
  useEffect(() => { setDebugLog(prev => prev + `\n[DEBUG] wagmi address: ${address}` + `\n[DEBUG] currentUser.address: ${currentUser?.address}` + `\n[DEBUG] currentUser: ${JSON.stringify(currentUser)}` + `\n[DEBUG] balance: ${balance}` + `\n[DEBUG] tokenId: ${tokenId}` + `\n[DEBUG] isPremium: ${isPremium}` ); }, [address, currentUser, balance, tokenId, isPremium]);
  useEffect(() => { supabase.auth.getSession().then(() => {}); }, []);
  useEffect(() => { if (receipt) { setIsActionLoading(false); if (receipt.status === 'success') { setFeedback({ message: 'Transaksi berhasil! Status Anda akan segera diperbarui.', type: 'success' }); refetchPremiumStatus?.(); refetchBalance?.(); refetchTokenId?.(); } else { setFeedback({ message: 'Transaksi gagal di blockchain. Kemungkinan fungsi belum terdaftar.', type: 'error' }); } } }, [receipt, refetchPremiumStatus, refetchBalance, refetchTokenId]);
  useEffect(() => { if (writeError) { setFeedback({ message: writeError.shortMessage || 'Transaksi ditolak atau gagal.', type: 'error' }); setDebugLog(prev => prev + `\nwriteError: ${JSON.stringify(writeError, replacerBigInt)}`); setIsActionLoading(false); } }, [writeError]);
  useEffect(() => { setDebugLog(prev => prev + `\nPrerequisite berubah: ${JSON.stringify({ allPrerequisitesMet, userHasNFT, tokenId, premiumPrice }, replacerBigInt, 2)}` ); // eslint-disable-next-line
  }, [allPrerequisitesMet, userHasNFT, tokenId, premiumPrice]);

  // Logika handleMint tidak berubah
  const handleMint = async () => { setDebugLog(prev => prev + `\nhandleMint dipanggil: allPrerequisitesMet=${allPrerequisitesMet}`); if (!allPrerequisitesMet) { setFeedback({ message: 'Lengkapi semua prasyarat (login, wallet, telegram, email) sebelum mint NFT.', type: 'error' }); return; } setFeedback({ message: '', type: '' }); resetWriteContract(); setIsActionLoading(true); const { data: { session } } = await supabase.auth.getSession(); if (!session) { setFeedback({ message: 'Session login Anda sudah habis atau belum login. Silakan login ulang terlebih dahulu.', type: 'error' }); setIsActionLoading(false); return; } try { const { data: signatureData, error: functionError } = await supabase.functions.invoke('generate-mint-signature', { body: { userAddress: address }, }); if (functionError) throw new Error(functionError.message); if (signatureData.error) throw new Error(signatureData.error); const { signature } = signatureData; writeContract({ address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'mintIdentity', args: [signature], }); setDebugLog(prev => prev + `\nwriteContract mintIdentity berhasil dipanggil`); } catch (err) { setFeedback({ message: err.message, type: 'error' }); setDebugLog(prev => prev + `\nERROR mint: ${err.message}`); setIsActionLoading(false); } };
  
  // Logika handleUpgrade tidak berubah (karena `value` memang harus dalam Wei)
  const handleUpgrade = async () => { const debugInfo = { allPrerequisitesMet, userHasNFT, tokenId, premiumPrice, isLoggedIn: prerequisites?.isLoggedIn, address, isActionLoading, isConfirming, }; setDebugLog(prev => prev + `\nhandleUpgrade dipanggil: ${JSON.stringify(debugInfo, replacerBigInt, 2)}`); if (!allPrerequisitesMet) { setFeedback({ message: 'Mohon lengkapi semua prasyarat sebelum upgrade (login, wallet connect, dsb).', type: 'error' }); return; } if (!userHasNFT) { setFeedback({ message: 'Anda harus memiliki NFT Identity sebelum bisa upgrade ke premium.', type: 'error' }); return; } if (!tokenId) { setFeedback({ message: 'Token ID tidak ditemukan. Silakan refresh halaman.', type: 'error' }); return; } if (premiumPrice === undefined || premiumPrice === null || BigInt(premiumPrice) <= 0n) { setFeedback({ message: 'Harga upgrade premium belum berhasil dimuat. Silakan refresh halaman.', type: 'error' }); return; } setFeedback({ message: '', type: '' }); resetWriteContract(); setIsActionLoading(true); try { writeContract({ address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'upgradeToPremium', args: [tokenId], value: BigInt(premiumPrice), }); setDebugLog(prev => prev + '\nwriteContract upgradeToPremium berhasil dipanggil'); } catch (err) { setFeedback({ message: err.message, type: 'error' }); setDebugLog(prev => prev + `\nERROR upgrade: ${err.message}`); setIsActionLoading(false); } };

  // Logika getButtonState tidak berubah
  const getButtonState = () => { const isLoading = isActionLoading || isConfirming || isFetchingTokenId; if (!prerequisites.isLoggedIn) return { text: "Login untuk Memulai", action: () => navigate('/login'), disabled: false }; if (!isConnected) return { text: "Connect Wallet", action: onOpenWalletModal, disabled: false }; if (!allPrerequisitesMet) return { text: "Lengkapi Profil Anda", action: () => navigate('/profile'), disabled: false }; if (isLoading) return { text: isConfirming ? "Konfirmasi..." : "Menunggu Wallet...", action: ()=>{}, disabled: true }; if (!userHasNFT) return { text: "Mint Your AFA Identity", action: handleMint, disabled: false }; if (userHasNFT && (tokenId === undefined || tokenId === null)) return { text: "Memuat Token ID...", action: ()=>{}, disabled: true }; if (userHasNFT && tokenIdError && (!identityObj || (Array.isArray(identityObj) ? identityObj[0] === undefined || identityObj[0] === "0" || identityObj[0] === 0 : !identityObj.tokenId || identityObj.tokenId === "0" || identityObj.tokenId === 0))) return { text: "Gagal mengambil Token ID", action: refetchTokenId, disabled: false }; if (userHasNFT && !isPremium) return { text: "Upgrade ke Premium (diskon beta test user)", action: handleUpgrade, disabled: false }; if (userHasNFT && isPremium) return { text: "Perpanjang Langganan", action: handleUpgrade, disabled: false }; return { text: "Loading Status...", action: ()=>{}, disabled: true }; };

  const buttonState = getButtonState();

  return (
    <section className="page-content py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Kembali ke Beranda
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Kolom Kiri: Visual NFT tidak berubah */}
          <div className="lg:col-span-2 flex justify-center items-center">
            <div className={`w-full max-w-xs aspect-square p-6 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center transition-all duration-300 hover:scale-105 ${isPremium ? 'bg-yellow-400/10 border-yellow-400/50 shadow-yellow-400/20' : 'bg-dark-card border-primary/20 shadow-primary/20'} -rotate-3 hover:rotate-0`}>
              <FontAwesomeIcon icon={isPremium ? faCrown : faFingerprint} className={`text-8xl drop-shadow-[0_5px_15px_rgba(27,77,193,0.4)] ${isPremium ? 'text-yellow-400' : 'text-primary'}`} />
              <h3 className="text-2xl font-bold text-white mt-4">AFA Identity</h3>
              <p className="text-sm text-gray-400">{userHasNFT ? `Token ID: #${tokenId?.toString()}` : 'Not Minted'}</p>
              <div className={`mt-4 font-bold text-xs py-1 px-3 rounded-full ${userHasNFT ? (isPremium ? 'bg-yellow-400/20 text-yellow-300' : 'bg-green-500/20 text-green-300') : 'bg-gray-500/20 text-gray-400'}`}>
                {userHasNFT ? (isPremium ? 'PREMIUM' : 'STANDARD') : 'UNCLAIMED'}
              </div>
              {userHasNFT && !isPremium && (
                <div className="mt-4 text-sm text-yellow-300">
                  Diskon Beta Test User<br />
                  {/* PERBAIKAN 4: Menampilkan harga dengan mengubah Wei ke ETH */}
                  {premiumPrice !== null && premiumPrice !== undefined
                    ? <>Harga Upgrade Premium: {ethers.formatEther(premiumPrice)} ETH</>
                    : 'Memuat harga...'}
                </div>
              )}
            </div>
          </div>
          {/* Kolom Kanan: Panel Aksi tidak berubah */}
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
              {(isActionLoading || isConfirming || isFetchingTokenId) && <FontAwesomeIcon icon={faSpinner} spin />}
              {buttonState.text}
            </button>
            {tokenIdError && (!identityObj || (Array.isArray(identityObj) ? identityObj[0] === undefined || identityObj[0] === "0" || identityObj[0] === 0 : !identityObj.tokenId || identityObj.tokenId === "0" || identityObj.tokenId === 0)) && (
              <div className="mt-2 text-sm text-center text-red-400">
                Gagal mengambil Token ID: {tokenIdError.message || tokenIdError.toString()}
              </div>
            )}
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
            <pre style={{ marginTop: 16, fontSize: 12, color: "#4b5563", background: "#f3f4f6", padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
              {debugLog}
            </pre>
            <pre style={{ marginTop: 8, fontSize: 12, color: "#7c3aed", background: "#ede9fe", padding: 8, borderRadius: 4, maxHeight: 150, overflow: 'auto' }}>
              identityObj: {identityDebug}
              {getIdentityError && "\ngetIdentityError: " + getIdentityError.message}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
