import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFingerprint, faArrowLeft, faSpinner, faCheckCircle,
    faTimesCircle, faWallet, faEnvelope, faCrown, faCube,
    faBolt, faShieldHalved, faInfinity, faSatelliteDish, faCalendarCheck,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import {
    useAccount, useWriteContract, useReadContract,
    useWaitForTransactionReceipt, useChainId, useDisconnect,
    useSwitchChain
} from 'wagmi';
import { ethers } from 'ethers';
import { supabase } from '../supabaseClient';
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

// --- PENAMBAHAN KONFIGURASI PHAROS TESTNET ---
const contractConfig = {
    11155420: { address: '0x8611E3C3F991C989fEF0427998062f77c9D0A2F1', abi: AfaIdentityABI },
    84532: { address: '0x36b1e78A718D77Cae16E1922Baaea2a555f77dcf', abi: AfaIdentityABI },
    688688: { address: '0x68703AD7183007fB56f749A2BF46a15f0286d11b', abi: AfaIdentityABI } // Pharos Testnet
};
const NFT_IMAGE_URL = 'https://ik.imagekit.io/5spt6gb2z/Gambar%20GIF.gif';
const chainInfo = {
    11155420: { name: "OP Sepolia", color: "bg-red-500", explorer: "https://sepolia-optimism.etherscan.io" },
    84532: { name: "Base Sepolia", color: "bg-blue-500", explorer: "https://sepolia.basescan.org" },
    688688: { name: "Pharos Testnet", color: "bg-green-500", explorer: "https://testnet.pharosscan.xyz" } // Pharos Testnet
};

// =================================================================================
// Komponen-Komponen Helper
// =================================================================================

const formatExpirationDate = (timestamp) => {
    if (!timestamp || timestamp === 0n) return null;
    const date = new Date(Number(timestamp) * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

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
        <span className="text-gray-600 dark:text-gray-300">{text}</span>
    </li>
);

const TierOption = ({ tier, label, price, selectedTier, onSelect }) => (
    <div
        onClick={() => onSelect(tier.id)}
        className={`card p-4 cursor-pointer transition-all duration-200 ${selectedTier === tier.id ? 'border-primary ring-2 ring-primary bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
    >
        <div className="flex flex-col items-center text-center">
            <p className="font-bold text-black dark:text-white mb-2">{label}</p>
            {price !== null && price !== undefined ? (
                <p className="font-semibold text-black dark:text-white text-sm">{ethers.formatEther(price)} ETH</p>
            ) : (
                <FontAwesomeIcon icon={faSpinner} spin className="text-gray-500" />
            )}
        </div>
    </div>
);

const UpgradeView = ({ tokenId, isPremium, expirationDate, onUpgrade, isConnected, onOpenWalletModal, walletMatches, currentUser, contractAddress, abi, isActionLoading }) => {
    const [selectedTier, setSelectedTier] = useState(0);

    const useTierPrice = (tierId) => {
        const { data } = useReadContract({
            address: contractAddress,
            abi: abi,
            functionName: 'getPriceForTier',
            args: [tierId],
            enabled: !!contractAddress,
        });
        return data;
    };

    const priceTier0 = useTierPrice(0);
    const priceTier1 = useTierPrice(1);
    const priceTier2 = useTierPrice(2);

    const Tiers = useMemo(() => [
        { id: 0, label: "1 Month", price: priceTier0 },
        { id: 1, label: "6 Months", price: priceTier1 },
        { id: 2, label: "1 Year", price: priceTier2 },
    ], [priceTier0, priceTier1, priceTier2]);

    const selectedTierInfo = Tiers.find(t => t.id === selectedTier);

    const handleUpgradeClick = () => {
        if (!selectedTierInfo || selectedTierInfo.price === undefined || selectedTierInfo.price === null) {
            alert("Price for the selected tier is not available yet. Please wait.");
            return;
        }
        onUpgrade(selectedTier, selectedTierInfo.price);
    };

    const renderButton = () => {
        if (!isConnected) {
            return (
                <button onClick={onOpenWalletModal} disabled={!currentUser?.address} className="btn-primary w-full py-3 text-lg rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {!currentUser?.address ? 'Please connect your wallet in your profile first.' : 'Connect to Wallet'}
                </button>
            );
        }
        if (!walletMatches) return null;
        return (
            <button 
                onClick={handleUpgradeClick} 
                disabled={isActionLoading} 
                className="btn-primary w-full py-3 text-lg rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
                {isActionLoading && <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />}
                {isPremium ? "Extend Subscription" : "Upgrade to Premium"}
            </button>
        );
    };

    return (
        <div>
            <h3 className="font-bold text-xl text-black dark:text-white mb-2">Premium Membership</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Choose your plan to unlock the full potential.</p>
            <div className="p-4 mb-6 rounded-lg bg-gray-500/5 dark:bg-white/5">
                <h4 className="font-semibold text-black dark:text-white mb-3">Premium Benefits:</h4>
                <ul className="space-y-2 text-sm">
                    <PremiumBenefit icon={faBolt} text="Early access to new features" />
                    <PremiumBenefit icon={faCrown} text="Exclusive content and roles" />
                    <PremiumBenefit icon={faShieldHalved} text="Enhanced security options" />
                    <PremiumBenefit icon={faInfinity} text="And much more..." />
                </ul>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
                {Tiers.map(tier => (
                    <TierOption key={tier.id} tier={tier} label={tier.label} price={tier.price} selectedTier={selectedTier} onSelect={setSelectedTier} />
                ))}
            </div>
            {renderButton()}
            {isPremium && expirationDate && (
                <p className="text-xs text-center mt-3 text-yellow-500">
                    Your premium status is active until {expirationDate}.
                </p>
            )}
        </div>
    );
};

// =================================================================================
// Komponen Utama
// =================================================================================

export default function PageAfaIdentity({ currentUser, onOpenWalletModal }) {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching, error: switchChainError } = useSwitchChain();

    const [feedback, setFeedback] = useState({ message: '', type: '', hash: null });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [tokenId, setTokenId] = useState(undefined);
    const [selectedChainId, setSelectedChainId] = useState(11155420);

    const { data: hash, writeContract, error: writeError, reset: resetWriteContract } = useWriteContract();
    const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const { address: contractAddress, abi } = useMemo(() => {
        return contractConfig[chainId] || { address: null, abi: null };
    }, [chainId]);
    
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: contractAddress, abi, functionName: 'balanceOf',
        args: [currentUser?.address], enabled: !!currentUser?.address && !!contractAddress,
    });
    const userHasNFT = useMemo(() => !!balance && Number(balance) > 0, [balance]);

    const { data: wagmiTokenId, refetch: refetchTokenId } = useReadContract({
        address: contractAddress, abi, functionName: 'tokenOfOwnerByIndex',
        args: [currentUser?.address, 0], enabled: !!currentUser?.address && userHasNFT && !!contractAddress,
    });
    const { data: isPremium, refetch: refetchPremiumStatus } = useReadContract({
        address: contractAddress, abi, functionName: 'isPremium',
        args: [tokenId], enabled: !!tokenId && !!contractAddress,
    });
    const { data: premiumExpirationTimestamp, refetch: refetchExpiration } = useReadContract({
        address: contractAddress, abi, functionName: 'getPremiumExpiration',
        args: [tokenId], enabled: !!tokenId && !!contractAddress,
    });

    const currentNetwork = useMemo(() => chainInfo[chainId], [chainId]);
    const walletMatches = useMemo(() => isConnected && currentUser?.address && address?.toLowerCase() === currentUser.address.toLowerCase(), [isConnected, address, currentUser?.address]);
    const isNetworkMismatched = useMemo(() => isConnected && chainId !== selectedChainId, [isConnected, chainId, selectedChainId]);
    
    useEffect(() => { if (wagmiTokenId !== undefined) setTokenId(wagmiTokenId); }, [wagmiTokenId]);
    
    useEffect(() => {
        if (receipt) {
            setIsActionLoading(false);
            const message = receipt.status === 'success' ? 'Transaction successful!' : 'Transaction failed.';
            setFeedback({ message, type: receipt.status, hash });
            if (receipt.status === 'success') {
                refetchPremiumStatus?.(); refetchBalance?.(); refetchTokenId?.(); refetchExpiration?.();
            }
        }
    }, [receipt, hash, refetchPremiumStatus, refetchBalance, refetchTokenId, refetchExpiration]);

    useEffect(() => {
        if (writeError) {
            setFeedback({ message: writeError.shortMessage || 'Transaction rejected.', type: 'error' });
            setIsActionLoading(false);
        }
    }, [writeError]);

    useEffect(() => {
        if (switchChainError) {
            setFeedback({ message: switchChainError.shortMessage || 'Failed to switch network.', type: 'error' });
        }
    }, [switchChainError]);

    const isEmailDummy = useMemo(() => currentUser?.email?.endsWith('@wallet.afa-web3.com') || currentUser?.email?.endsWith('@telegram.user'), [currentUser?.email]);
    const prerequisites = useMemo(() => ({
        isLoggedIn: !!currentUser?.id,
        walletConnected: walletMatches,
        telegramConnected: !!currentUser?.telegram_user_id,
        emailSecured: !isEmailDummy,
    }), [currentUser, walletMatches, isEmailDummy]);
    const allPrerequisitesMet = useMemo(() => Object.values(prerequisites).every(Boolean), [prerequisites]);
    
    const handleSwitchNetwork = () => {
        if (!switchChain) return;
        setFeedback({ message: '', type: '' });
        switchChain({ chainId: selectedChainId });
    };

    const handleMint = async () => {
        if (!allPrerequisitesMet) return setFeedback({ message: 'Please complete all prerequisites.', type: 'error' });
        if (isNetworkMismatched) return handleSwitchNetwork();
        
        const mintContract = contractConfig[selectedChainId];
        if (!mintContract) return setFeedback({ message: 'Selected network not supported.', type: 'error' });
        
        setFeedback({ message: '', type: '' });
        resetWriteContract();
        setIsActionLoading(true);

        try {
            setFeedback({ message: 'Requesting mint signature...', type: 'info' });
            const { data: signatureData, error: signatureError } = await supabase.functions.invoke('generate-mint-signature', {
                body: { userAddress: address, chainId: selectedChainId },
            });
            if (signatureError) throw new Error(signatureError.message);
            const { signature } = signatureData;
            if (!signature) throw new Error('Failed to retrieve signature.');
            
            setFeedback({ message: 'Awaiting confirmation in wallet...', type: 'info' });
            writeContract({
                address: mintContract.address, abi: mintContract.abi,
                functionName: 'mintIdentity', args: [signature],
            });
        } catch (err) {
            setFeedback({ message: `Minting failed: ${err.message}`, type: 'error' });
            setIsActionLoading(false);
        }
    };
    
    const handleUpgrade = async (tier, price) => {
        if (!isConnected || !walletMatches) {
            return setFeedback({ message: 'Please connect the correct wallet.', type: 'error' });
        }
        if (tokenId === undefined || price === undefined) {
            return setFeedback({ message: 'Token ID or price is missing.', type: 'error' });
        }
        if (!contractAddress) {
            return setFeedback({ message: `Your NFT may be on a different network. Please switch to the correct network in your wallet.`, type: 'error' });
        }

        setFeedback({ message: '', type: '' });
        resetWriteContract();
        setIsActionLoading(true);

        try {
            setFeedback({ message: 'Awaiting confirmation in your wallet...', type: 'info' });
            writeContract({
                address: contractAddress,
                abi: abi,
                functionName: 'upgradeToPremium',
                args: [tokenId, tier],
                value: price,
            });
        } catch (err) {
            const errorMessage = err.message || 'An unexpected error occurred.';
            setFeedback({ message: `Upgrade failed: ${errorMessage}`, type: 'error' });
            setIsActionLoading(false);
        }
    };

    const getWalletStatusMessage = () => {
        if (!isConnected) return 'Wallet not connected';
        if (!currentUser || !currentUser.address) return 'Link a wallet in your profile';
        if (!walletMatches) return `Wrong wallet. Connect to ${currentUser.address.substring(0, 6)}...`;
        return `${address.substring(0, 6)}...${address.slice(-4)}`;
    };

    const renderMintButton = () => {
        if (!isConnected) return <button onClick={onOpenWalletModal} disabled={!currentUser?.address} className="btn-primary w-full py-3 text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">{!currentUser?.address ? 'Connect wallet in profile' : 'Connect to Wallet'}</button>;
        if (!walletMatches) return null;

        if (isNetworkMismatched) {
             return (
                 <button onClick={handleSwitchNetwork} disabled={isSwitching} className="btn-warning w-full py-3 text-lg rounded-xl flex items-center justify-center gap-2">
                     {isSwitching ? (<><FontAwesomeIcon icon={faSpinner} spin /><span>Switching...</span></>) : (`Switch to ${chainInfo[selectedChainId].name}`)}
                 </button>
             );
        }
        
        return (
            <button onClick={handleMint} disabled={!allPrerequisitesMet || isActionLoading || isConfirming} className="btn-primary w-full py-3 text-lg rounded-xl disabled:opacity-50">
                {(isActionLoading || isConfirming) && <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />}
                Mint for Free on {chainInfo[selectedChainId]?.name || '...'}
            </button>
        );
    };

    return (
        <section className="min-h-screen text-light-text dark:text-dark-text">
            <div className="page-content py-8 md:py-12 max-w-6xl mx-auto px-4">
                <header className="flex justify-between items-center mb-10">
                    <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faArrowLeft} /> Back to Home
                    </Link>
                    {isConnected && currentNetwork && (
                        <div className={`flex items-center gap-2 text-xs font-bold text-white px-3 py-1.5 rounded-full ${currentNetwork.color}`}>
                            <FontAwesomeIcon icon={faSatelliteDish} />
                            <span>{currentNetwork.name}</span>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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

                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold futuristic-text-gradient mb-3">Your On-Chain Identity</h1>
                        <p className="text-lg text-gray-400 mb-8">Your unique, soul-bound token for the entire AFA ecosystem.</p>
                        
                        {isConnected && !walletMatches && currentUser?.address && (
                             <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
                                 <div className="flex items-start gap-3">
                                     <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl mt-1" />
                                     <div>
                                         <p className="font-bold">Wrong Wallet Connected</p>
                                         <p className="text-sm">Please connect to the wallet address saved in your profile.</p>
                                     </div>
                                 </div>
                                 <button onClick={() => disconnect()} className="mt-3 w-full bg-red-500/20 text-white font-bold text-sm py-2 px-4 rounded-md hover:bg-red-500/40 transition-colors">
                                     Disconnect
                                 </button>
                             </div>
                        )}

                        {userHasNFT ? (
                            <UpgradeView 
                                tokenId={tokenId} isPremium={isPremium} expirationDate={formatExpirationDate(premiumExpirationTimestamp)}
                                onUpgrade={handleUpgrade} isConnected={isConnected} onOpenWalletModal={onOpenWalletModal}
                                walletMatches={walletMatches} currentUser={currentUser} contractAddress={contractAddress} abi={abi}
                                isActionLoading={isActionLoading || isConfirming}
                            />
                        ) : (
                            <div className="card p-6">
                                <h3 className="font-bold text-xl text-light-text dark:text-white mb-4">Mint Your AFA Identity</h3>
                                <div className="space-y-2 mb-6">
                                    <PrerequisiteItem icon={faCheckCircle} title="Log In to AFA Account" isComplete={prerequisites.isLoggedIn} value={currentUser?.email} action={() => navigate('/login')} actionLabel="Login" />
                                    <PrerequisiteItem icon={faWallet} title="Connect Wallet" isComplete={prerequisites.walletConnected} value={getWalletStatusMessage()} action={prerequisites.isLoggedIn && !currentUser.address ? () => navigate('/profile') : onOpenWalletModal} actionLabel={prerequisites.isLoggedIn && !currentUser.address ? 'Link' : 'Connect'} />
                                    <PrerequisiteItem icon={faTelegram} title="Link Telegram" isComplete={prerequisites.telegramConnected} value={prerequisites.telegramConnected ? 'Linked' : 'Not linked'} action={() => navigate('/profile')} actionLabel="Link" />
                                    <PrerequisiteItem icon={faEnvelope} title="Secure with Email" isComplete={!isEmailDummy} value={isEmailDummy ? 'Not secured' : 'Secured'} action={() => navigate('/profile')} actionLabel="Secure" />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-light-text dark:text-gray-300 mb-2">
                                        Select Minting Network
                                    </label>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-dark-background">
                                        {Object.entries(chainInfo).map(([id, info]) => (
                                            <button key={id} onClick={() => setSelectedChainId(Number(id))}
                                                className={`flex-1 text-sm font-bold py-2 px-3 rounded-md transition-colors ${selectedChainId === Number(id) ? `${info.color} text-white shadow` : 'bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                            >
                                                {info.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {renderMintButton()}
                            </div>
                        )}
                        
                        <div className="mt-6 space-y-2">
                             {feedback.message && (
                                 <div className={`text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                     <FontAwesomeIcon icon={feedback.type === 'error' ? faTimesCircle : faCheckCircle} />
                                     <span className="break-all">{feedback.message}</span>
                                 </div>
                            )}
                            {feedback.hash && currentNetwork?.explorer && (
                                 <div className="text-xs text-center text-gray-400">
                                     <a href={`${currentNetwork.explorer}/tx/${feedback.hash}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
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
