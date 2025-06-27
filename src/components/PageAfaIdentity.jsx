import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFingerprint, faArrowLeft, faSpinner, faCheckCircle,
  faTimesCircle, faWallet, faEnvelope, faCrown, faCube,
  faBolt, faShieldHalved, faInfinity, faSatelliteDish
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import {
  useAccount, useWriteContract, useReadContract,
  useWaitForTransactionReceipt, useChainId
} from 'wagmi';
import { ethers } from 'ethers';
import { supabase } from '../supabaseClient';
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = '0x8611E3C3F991C989fEF0427998062f77c9D0A2F1';
const NFT_IMAGE_URL = 'https://ik.imagekit.io/5spt6gb2z/Gambar%20GIF.gif';

const PriceInWeiABI = [
  {
    "inputs": [],
    "name": "priceInWei",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const chainInfo = {
  11155420: { name: "OP Sepolia", color: "bg-red-500", explorer: "https://sepolia-optimism.etherscan.io" },
  // Add other networks here if needed
};

// --- SUB-COMPONENTS ---
const PrerequisiteItem = ({ icon, title, value, isComplete, action, actionLabel }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
    <div className="flex items-center gap-4">
      <FontAwesomeIcon icon={icon} className={`text-xl w-6 ${isComplete ? 'text-green-500' : 'text-yellow-500'}`} />
      <div>
        <p className="font-semibold text-light-text dark:text-white">{title}</p>
        {value && <p className="text-sm text-light-subtle dark:text-gray-400 break-all">{value}</p>}
      </div>
    </div>
    {!isComplete && (
      <button onClick={action} className="text-sm bg-accent text-white font-bold px-3 py-1.5 rounded-md hover:bg-accent-dark transition-colors">
        {actionLabel}
      </button>
    )}
  </div>
);

const PremiumBenefit = ({ icon, text }) => (
  <li className="flex items-center gap-3">
    <FontAwesomeIcon icon={icon} className="text-primary w-5" />
    <span className="text-light-subtle dark:text-gray-300">{text}</span>
  </li>
);

// --- HELPER ---
function replacerBigInt(key, value) {
  return typeof value === 'bigint' ? value.toString() : value;
}

// --- MAIN COMPONENT ---
export default function PageAfaIdentity({ currentUser, onOpenWalletModal }) {
  const navigate = useNavigate();
  const { address, isConnected, chainId: connectedChainId } = useAccount();

  // --- STATE ---
  const [feedback, setFeedback] = useState({ message: '', type: '', hash: null });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(null);
  const [tokenId, setTokenId] = useState(undefined);

  // --- WAGMI HOOKS ---
  const { data: hash, writeContract, error: writeError, reset: resetWriteContract } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });
  const chainId = useChainId();

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'balanceOf',
    args: [currentUser?.address],
    enabled: !!currentUser?.address,
  });

  const { data: rawPrice } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PriceInWeiABI,
    functionName: 'priceInWei',
  });

  const { data: wagmiTokenId, isLoading: isFetchingTokenId, refetch: refetchTokenId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [currentUser?.address, 0],
    enabled: !!currentUser?.address && !!balance && Number(balance) > 0,
  });
  
  const { data: isPremium, refetch: refetchPremiumStatus } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: AfaIdentityABI,
    functionName: 'isPremium',
    args: [tokenId],
    enabled: !!tokenId,
  });

  // --- MEMOIZED VALUES ---
  const userHasNFT = useMemo(() => !!balance && Number(balance) > 0, [balance]);
  const currentNetwork = useMemo(() => chainInfo[chainId], [chainId]);

  // --- EFFECTS ---
  useEffect(() => {
    if (rawPrice !== undefined && rawPrice !== null) setPremiumPrice(rawPrice);
  }, [rawPrice]);

  useEffect(() => {
    if (wagmiTokenId !== undefined) setTokenId(wagmiTokenId);
  }, [wagmiTokenId]);
  
  useEffect(() => {
    if (receipt) {
      setIsActionLoading(false);
      const message = receipt.status === 'success' ? 'Transaction successful! Your status will update shortly.' : 'Transaction failed on the blockchain.';
      setFeedback({ message, type: receipt.status, hash });
      if (receipt.status === 'success') {
        refetchPremiumStatus?.();
        refetchBalance?.();
        refetchTokenId?.();
      }
    }
  }, [receipt, hash, refetchPremiumStatus, refetchBalance, refetchTokenId]);

  useEffect(() => {
    if (writeError) {
      setFeedback({ message: writeError.shortMessage || 'Transaction was rejected or failed.', type: 'error', hash: null });
      setIsActionLoading(false);
    }
  }, [writeError]);

  // --- HANDLERS ---
  const handleMint = async () => {
    // This function remains the same
    if (!allPrerequisitesMet) { setFeedback({ message: 'Please complete all prerequisites before minting.', type: 'error' }); return; }
    setFeedback({ message: '', type: '' });
    resetWriteContract();
    setIsActionLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setFeedback({ message: 'Your session has expired. Please log in again.', type: 'error' }); setIsActionLoading(false); return; }
    try {
      const { data: signatureData, error: functionError } = await supabase.functions.invoke('generate-mint-signature', { body: { userAddress: address } });
      if (functionError) throw new Error(functionError.message);
      if (signatureData.error) throw new Error(signatureData.error);
      const { signature } = signatureData;
      writeContract({ address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'mintIdentity', args: [signature] });
    } catch (err) {
      setFeedback({ message: err.message, type: 'error' });
      setIsActionLoading(false);
    }
  };
  
  const handleUpgrade = async () => {
    // This function remains the same
    if (!userHasNFT || !tokenId) { setFeedback({ message: 'You must own an AFA Identity NFT to upgrade.', type: 'error' }); return; }
    if (premiumPrice === undefined || premiumPrice === null || BigInt(premiumPrice) <= 0n) { setFeedback({ message: 'Premium upgrade price could not be loaded. Please refresh.', type: 'error' }); return; }
    setFeedback({ message: '', type: '' });
    resetWriteContract();
    setIsActionLoading(true);
    try {
      writeContract({ address: CONTRACT_ADDRESS, abi: AfaIdentityABI, functionName: 'upgradeToPremium', args: [tokenId], value: BigInt(premiumPrice) });
    } catch (err) {
      setFeedback({ message: err.message, type: 'error' });
      setIsActionLoading(false);
    }
  };

  const isEmailDummy = currentUser?.email?.endsWith('@wallet.afa-web3.com') || currentUser?.email?.endsWith('@telegram.user');
  const prerequisites = {
    isLoggedIn: !!currentUser?.id,
    walletConnected: !!currentUser?.address && isConnected && currentUser.address.toLowerCase() === address?.toLowerCase(),
    telegramConnected: !!currentUser?.telegram_user_id,
    emailSecured: !isEmailDummy,
  };
  const allPrerequisitesMet = Object.values(prerequisites).every(Boolean);

  // --- UI & RENDER ---
  return (
    <section className="bg-light-bg dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text">
      <div className="page-content py-8 md:py-12 max-w-6xl mx-auto px-4">
        <header className="flex justify-between items-center mb-10">
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Home
          </Link>
          {isConnected && currentNetwork && (
            <div className="flex items-center gap-2 text-xs font-bold text-white px-3 py-1.5 rounded-full" style={{ backgroundColor: currentNetwork.color }}>
              <FontAwesomeIcon icon={faSatelliteDish} />
              <span>{currentNetwork.name}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* --- LEFT COLUMN: NFT VISUAL --- */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-sm bg-dark-card p-6 rounded-3xl shadow-2xl shadow-primary/10 border border-white/5">
              <img src={NFT_IMAGE_URL} alt="AFA Identity NFT" className="w-full rounded-2xl" />
              <div className="mt-6 text-center">
                <h2 className="text-3xl font-bold text-white">AFA Identity</h2>
                <p className="text-gray-400">{userHasNFT ? `Token ID: #${tokenId?.toString()}` : 'Not Minted Yet'}</p>
                {userHasNFT && (
                   <div className={`mt-4 inline-block font-bold text-xs py-1 px-4 rounded-full ${isPremium ? 'bg-yellow-400/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                     {isPremium ? 'PREMIUM MEMBER' : 'STANDARD MEMBER'}
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: ACTIONS & INFO --- */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold futuristic-text-gradient mb-3">Your On-Chain Passport</h1>
            <p className="text-lg text-gray-400 mb-8">
              Your unique, soul-bound token for the entire AFA ecosystem.
            </p>
            
            {!userHasNFT ? (
              // --- MINTING VIEW ---
              <div className="bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-xl text-light-text dark:text-white mb-4">Mint Your AFA Identity</h3>
                <div className="space-y-2 mb-6">
                  <PrerequisiteItem icon={faCheckCircle} title="Log In to AFA Account" isComplete={prerequisites.isLoggedIn} value={currentUser?.email} action={() => navigate('/login')} actionLabel="Login" />
                  <PrerequisiteItem icon={faWallet} title="Connect Wallet" isComplete={prerequisites.walletConnected} value={currentUser?.address ? `${currentUser.address.substring(0,6)}...` : 'Not connected'} action={onOpenWalletModal} actionLabel="Connect" />
                  <PrerequisiteItem icon={faTelegram} title="Link Telegram" isComplete={prerequisites.telegramConnected} value={prerequisites.telegramConnected ? 'Linked' : 'Not linked'} action={() => navigate('/profile')} actionLabel="Link" />
                  <PrerequisiteItem icon={faEnvelope} title="Secure with Email" isComplete={prerequisites.emailSecured} value={isEmailDummy ? 'Dummy account' : 'Secured'} action={() => navigate('/profile')} actionLabel="Secure" />
                </div>
                <button
                  onClick={handleMint}
                  disabled={!allPrerequisitesMet || isActionLoading || isConfirming}
                  className="btn-primary w-full py-3 text-lg rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {(isActionLoading || isConfirming) && <FontAwesomeIcon icon={faSpinner} spin />}
                  Mint for Free
                </button>
              </div>
            ) : (
              // --- UPGRADE VIEW ---
              <div className="bg-light-card dark:bg-dark-card border border-black/10 dark:border-white/10 rounded-2xl p-6">
                 <h3 className="font-bold text-xl text-light-text dark:text-white mb-2">Premium Membership</h3>
                 <p className="text-gray-400 text-sm mb-4">Unlock the full potential of the AFA ecosystem.</p>

                 <div className="bg-black/20 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-white mb-3">Premium Benefits:</h4>
                    <ul className="space-y-2 text-sm">
                      <PremiumBenefit icon={faBolt} text="Early access to new features" />
                      <PremiumBenefit icon={faCrown} text="Exclusive content and roles" />
                      <PremiumBenefit icon={faShieldHalved} text="Enhanced security options" />
                      <PremiumBenefit icon={faInfinity} text="And much more..." />
                    </ul>
                 </div>
                 
                 <div className="text-center mb-6">
                    <p className="text-gray-400 text-sm">Upgrade / Renewal Price</p>
                    <p className="text-3xl font-bold text-white">
                      {premiumPrice !== null ? `${ethers.formatEther(premiumPrice)} ETH` : <FontAwesomeIcon icon={faSpinner} spin />}
                    </p>
                 </div>

                 <button
                  onClick={handleUpgrade}
                  disabled={isPremium || isActionLoading || isConfirming}
                  className="btn-primary w-full py-3 text-lg rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {(isActionLoading || isConfirming) && <FontAwesomeIcon icon={faSpinner} spin />}
                  {isPremium ? "Already Premium" : "Upgrade to Premium"}
                </button>
              </div>
            )}

            {/* --- FEEDBACK & LOG AREA --- */}
            <div className="mt-6 space-y-2">
              {feedback.message && (
                <div className={`text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  <FontAwesomeIcon icon={feedback.type === 'error' ? faTimesCircle : faCheckCircle} />
                  <span className="break-all">{feedback.message}</span>
                </div>
              )}
              {feedback.hash && (
                <div className="text-xs text-center text-gray-400">
                  <a href={`${currentNetwork?.explorer}/tx/${feedback.hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
                    View Transaction on Explorer
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
