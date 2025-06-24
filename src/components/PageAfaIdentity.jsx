// src/components/PageAfaIdentity.jsx

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint, faArrowLeft, faGift, faShieldHalved, faIdCard, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import translationsId from '../translations/id.json';
import translationsEn from '../translations/en.json';
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

const CONTRACT_ADDRESS = '0xd9aB239C897A1595df704124c0bD77560CA3655F';

const getTranslations = (lang) => lang === 'id' ? translationsId : translationsEn;

const FeatureItem = ({ icon, title, description }) => (
  <div className="flex items-start gap-4">
    <FontAwesomeIcon icon={icon} className="text-xl text-accent dark:text-accent-dark mt-1 w-6" />
    <div>
      <h4 className="font-semibold text-light-text dark:text-white">{title}</h4>
      <p className="text-sm text-light-subtle dark:text-gray-400">{description}</p>
    </div>
  </div>
);

export default function PageAfaIdentity({ currentUser }) {
  const { language } = useLanguage();
  const t = getTranslations(language).afaIdentityPage || {};
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [ipfsUrl, setIpfsUrl] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { data: identityRaw, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'getIdentity',
    args: [address],
    enabled: !!address
  });

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.user_metadata?.bio || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id || !currentUser?.email || !currentUser?.telegram_user_id || !currentUser?.address) {
      setFeedback({ message: 'Silakan login dan lengkapi profil Anda terlebih dahulu.', type: 'error' });
    }
  }, [currentUser]);

  useEffect(() => {
    if (isConfirmed) {
      setFeedback({ message: 'Identity berhasil diminting!', type: 'success' });
      refetch();
    }
  }, [isConfirmed]);

const uploadToIPFS = async () => {
  try {
    const metadata = {
      name,
      description: bio,
      image: `https://placehold.co/600x600/1B4DC1/FFF?text=${encodeURIComponent(name)}`
    };

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        }
      }
    );

    const ipfsHash = response.data.IpfsHash;
    return `ipfs://${ipfsHash}`;
  } catch (err) {
    console.error("Upload to IPFS failed:", err?.response?.data || err.message);
    throw new Error("Upload metadata ke IPFS gagal. Cek kembali JWT atau jaringan Anda.");
  }
};




const handleMint = async () => {
  try {
    setFeedback({ message: '', type: '' });
    console.log("🔁 Uploading to IPFS...");
    const ipfs = await uploadToIPFS();
    console.log("✅ IPFS URL:", ipfs);

    console.log("🚀 Calling writeContract...");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: AfaIdentityABI,
      functionName: 'registerIdentity',
      args: [address, ipfs],
    });
  } catch (err) {
    console.error("❌ Mint error:", err.message);
    setFeedback({ message: err.message, type: 'error' });
  }
};

  return (
    <section className="page-content py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline mb-8 inline-flex items-center">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          {t.backToHome || 'Kembali ke Beranda'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="lg:col-span-2 flex justify-center items-center">
            <div className="w-full max-w-xs aspect-square bg-dark-card p-6 rounded-2xl shadow-2xl shadow-primary/20 border border-primary/20 flex flex-col justify-center items-center text-center -rotate-3 transition-all duration-300 hover:rotate-0 hover:scale-105">
              <FontAwesomeIcon icon={faFingerprint} className="text-8xl text-primary drop-shadow-[0_5px_15px_rgba(27,77,193,0.4)]" />
              <h3 className="text-2xl font-bold text-white mt-4">AFA Identity</h3>
              <p className="text-sm text-gray-400">ID: {currentUser?.id ? `${currentUser.id.substring(0, 8)}...` : 'Not Logged In'}</p>
              <div className="mt-4 bg-primary/20 text-primary-dark font-bold text-xs py-1 px-3 rounded-full">SOULBOUND</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h1 className="text-4xl md:text-5xl font-bold futuristic-text-gradient mb-3">{t.title || 'Claim Your AFA Identity'}</h1>
            <p className="text-lg text-light-subtle dark:text-gray-400 mb-6">{t.subtitle || 'Mint a unique NFT that represents your identity in the AFA Web3Tool ecosystem.'}</p>

            <div className="prose prose-base max-w-none dark:prose-invert text-light-subtle prose-a:text-primary mb-8">
              <p>{t.description || 'By holding the AFA Identity NFT, you gain access to exclusive features, special community roles, and potential future rewards. This is your passport to the Web3 world with AFA.'}</p>
            </div>

            <div className="space-y-4 mb-8 p-6 bg-light-soft dark:bg-dark-card rounded-2xl border border-black/5 dark:border-white/10">
              <FeatureItem icon={faGift} title="Akses Eksklusif" description="Membuka event dan airdrop khusus pemegang identitas." />
              <FeatureItem icon={faShieldHalved} title="Peran Komunitas" description="Dapatkan peran khusus di server Discord dan grup Telegram kami." />
              <FeatureItem icon={faIdCard} title="Identitas Terverifikasi" description="Membuktikan keanggotaan Anda di dalam ekosistem AFA." />
            </div>

            <button
              onClick={handleMint}
              disabled={!currentUser?.id || !address || isPending || isConfirming}
              className="btn-primary w-full py-4 text-xl rounded-xl shadow-lg shadow-primary/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending ? 'Menunggu Wallet...' : isConfirming ? 'Konfirmasi...' : t.mintButton || 'Mint Now for Free'}
            </button>

            {feedback.message && (
              <div className={`mt-4 text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                <FontAwesomeIcon icon={feedback.type === 'error' ? faExclamationTriangle : faCheckCircle} />
                <span className="break-all">{feedback.message}</span>
              </div>
            )}

            {hash && (
              <div className="mt-4 text-xs text-center text-light-subtle dark:text-gray-400">
                <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
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

