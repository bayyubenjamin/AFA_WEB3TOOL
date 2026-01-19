// src/components/PageQuestCenter.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFire, faGem, faCheckCircle, faLock, faGift, faTrophy, 
    faCalendarCheck, faBolt, faSpinner, faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { faTelegram, faEthereum } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import { useQuestSystem } from '../hooks/useQuestSystem';
import { useReadContract } from 'wagmi';
import AfaIdentityABI from '../contracts/AFAIdentityDiamondABI.json';

// --- CONTRACT CONFIG (Menggunakan config yang sama dengan PageAfaIdentity) ---
const contractAddress = '0x8611E3C3F991C989fEF0427998062f77c9D0A2F1'; // OP Sepolia Default

export default function PageQuestCenter({ currentUser }) {
    // Cek status premium user secara on-chain untuk multiplier
    const { data: balance } = useReadContract({
        address: contractAddress, abi: AfaIdentityABI,
        functionName: 'balanceOf', args: [currentUser?.address],
        enabled: !!currentUser?.address,
    });
    
    // Asumsi token ID 0 utk simplifikasi cek premium, idealnya fetch token ID user dulu
    const { data: isPremium } = useReadContract({
        address: contractAddress, abi: AfaIdentityABI,
        functionName: 'isPremium', args: [0], 
        enabled: !!balance && Number(balance) > 0,
    });

    const { questData, loading, handleDailyCheckIn } = useQuestSystem(currentUser, isPremium);
    const [claimAnimation, setClaimAnimation] = useState(false);

    const onClaimDaily = async () => {
        const result = await handleDailyCheckIn();
        if (result.success) {
            setClaimAnimation(true);
            setTimeout(() => setClaimAnimation(false), 3000);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
                <FontAwesomeIcon icon={faLock} className="text-6xl text-slate-300 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700 dark:text-white">Login Required</h2>
                <p className="text-slate-500 mb-6">Access the Quest Center to earn rewards and track your progress.</p>
                <Link to="/login" className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary/30">
                    Login Now
                </Link>
            </div>
        );
    }

    return (
        <section className="page-content py-8 max-w-5xl mx-auto px-4">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {/* Total Points Card */}
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-white/10 text-9xl"><FontAwesomeIcon icon={faGem} /></div>
                    <div className="relative z-10">
                        <p className="text-orange-100 font-bold text-sm uppercase tracking-wider mb-1">Total Points</p>
                        <h2 className="text-4xl font-extrabold flex items-center gap-3">
                            {questData.totalPoints.toLocaleString()} 
                            <span className="text-lg bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">XP</span>
                        </h2>
                        <p className="text-xs mt-3 text-orange-100 font-medium">
                            Rank: <span className="text-white font-bold">Silver Member</span>
                        </p>
                    </div>
                </div>

                {/* Daily Streak Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Current Streak</p>
                            <FontAwesomeIcon icon={faFire} className={`text-2xl ${questData.streak > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white">
                            {questData.streak} <span className="text-base font-normal text-slate-500">Days</span>
                        </h2>
                    </div>
                    <div className="mt-4 flex gap-1">
                        {[1,2,3,4,5,6,7].map((day) => (
                            <div key={day} className={`h-2 flex-1 rounded-full ${day <= (questData.streak % 7) || (questData.streak > 0 && day === 1 && questData.dailyClaimed) ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        ))}
                    </div>
                </div>

                {/* Daily Check-in Action */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-1 border-2 border-primary/10 shadow-lg relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-xl"></div>
                    <div className="relative h-full flex flex-col items-center justify-center p-5 text-center">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">Daily Check-in</h3>
                        <p className="text-xs text-slate-500 mb-4">
                            {isPremium ? '2x Reward Active (Premium)' : 'Get 2x Reward with Premium'}
                        </p>
                        
                        {questData.dailyClaimed ? (
                            <button disabled className="w-full bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-default">
                                <FontAwesomeIcon icon={faCheckCircle} /> Claimed
                            </button>
                        ) : (
                            <button 
                                onClick={onClaimDaily} 
                                disabled={loading}
                                className="w-full btn-primary py-3 rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform active:scale-95"
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Claim +10 XP'}
                            </button>
                        )}
                        
                        {/* Timer until next */}
                        {questData.dailyClaimed && (
                             <p className="text-xs text-slate-400 mt-2">Next reward in: 14h 20m</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Quest List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FontAwesomeIcon icon={faTrophy} className="text-yellow-500" />
                        Active Quests
                    </h3>

                    <div className="space-y-4">
                        {questData.quests.map((quest) => (
                            <div key={quest.id} className={`flex items-center p-4 rounded-xl border transition-all ${quest.completed ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 opacity-80' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 shadow-sm'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 ${quest.completed ? 'bg-green-100 text-green-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                                    <FontAwesomeIcon icon={
                                        quest.icon === 'telegram' ? faTelegram : 
                                        quest.icon === 'id-card' ? faEthereum : 
                                        faGift
                                    } />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-slate-800 dark:text-white">{quest.title}</h4>
                                    <p className="text-xs text-slate-500">Reward: <span className="font-bold text-orange-500">+{quest.reward} XP</span></p>
                                </div>
                                <div>
                                    {quest.completed ? (
                                        <span className="text-green-600 font-bold text-sm bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                                            <FontAwesomeIcon icon={faCheckCircle} /> Done
                                        </span>
                                    ) : (
                                        <Link to={quest.id === 'q1' ? '/identity' : '/profile'} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                            Go <FontAwesomeIcon icon={faArrowRight} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mini Leaderboard / Status */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-fit">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Your Status</h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <span className="text-sm text-slate-500">Account Type</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${isPremium ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-200 text-slate-600'}`}>
                                {isPremium ? 'PREMIUM' : 'FREE'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <span className="text-sm text-slate-500">Point Multiplier</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-white">
                                {isPremium ? '2.0x' : '1.0x'}
                            </span>
                        </div>

                        {!isPremium && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl border border-primary/20">
                                <p className="text-xs text-primary font-bold mb-2">Upgrade to Premium</p>
                                <p className="text-xs text-slate-500 mb-3">Get 2x points on every check-in and unlock exclusive quests.</p>
                                <Link to="/identity" className="block w-full text-center bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                    Upgrade Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animation Overlay */}
            {claimAnimation && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur-sm p-8 rounded-3xl text-center animate-bounce-in">
                        <FontAwesomeIcon icon={faGift} className="text-6xl text-yellow-400 mb-4 animate-bounce" />
                        <h2 className="text-3xl font-bold text-white mb-2">Claimed!</h2>
                        <p className="text-xl text-yellow-300 font-bold">+ {isPremium ? '20' : '10'} XP</p>
                    </div>
                </div>
            )}
        </section>
    );
}
