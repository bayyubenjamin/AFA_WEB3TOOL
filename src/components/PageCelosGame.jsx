import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { toast } from 'react-hot-toast';

// Ganti dengan Address Smart Contract yang baru di-deploy di Celo
const CONTRACT_ADDRESS = "0x..."; 
import CeloTapGameABI from '../contracts/CeloTapGameABI.json';

const PageCelosGame = () => {
  const { address, isConnected } = useAccount();
  const [isTapping, setIsTapping] = useState(false);

  // Hook untuk memanggil fungsi Write (tap)
  const { writeContract, isPending, isSuccess } = useWriteContract();

  // Read: Total global taps
  const { data: totalTaps, refetch: refetchTotal } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CeloTapGameABI,
    functionName: 'totalTaps',
  });

  // Read: User taps
  const { data: userTaps, refetch: refetchUser } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CeloTapGameABI,
    functionName: 'getUserTaps',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read: Leaderboard
  const { data: leaderboard, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CeloTapGameABI,
    functionName: 'getLeaderboard',
  });

  // Refresh data setiap kali tx sukses
  useEffect(() => {
    if (isSuccess) {
      refetchTotal();
      refetchUser();
      refetchLeaderboard();
      setIsTapping(false);
      toast.success('Tap Transaction Confirmed!');
    }
  }, [isSuccess]);

  const handleTap = async () => {
    if (!isConnected) {
      toast.error('Connect your wallet first!');
      return;
    }
    
    setIsTapping(true);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CeloTapGameABI,
        functionName: 'tap',
      });
    } catch (error) {
      console.error(error);
      setIsTapping(false);
      toast.error('Transaction Failed');
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md mt-16 pb-24">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
        
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            CELOS TAP GAME
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Tap on Celo Network. Ultra low gas fees!</p>
        </div>

        {/* Score Board */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Taps</p>
            <p className="text-2xl font-bold text-green-500">{userTaps ? userTaps.toString() : '0'}</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Global Taps</p>
            <p className="text-2xl font-bold text-blue-500">{totalTaps ? totalTaps.toString() : '0'}</p>
          </div>
        </div>

        {/* Giant TAP Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleTap}
            disabled={isPending || isTapping}
            className={`w-48 h-48 rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center transform transition-all duration-200 
              ${isPending || isTapping ? 'bg-gray-400 scale-95 cursor-not-allowed' : 'bg-gradient-to-br from-green-400 to-green-600 hover:scale-105 active:scale-95'}
            `}
          >
            <span className="text-white text-5xl font-black drop-shadow-md tracking-wider">
              {isPending || isTapping ? '...' : 'TAP'}
            </span>
          </button>
        </div>

        {/* Leaderboard Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            🏆 Top 10 Leaderboard
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {leaderboard && leaderboard.map((player, index) => {
              // Abaikan alamat default (0x00...00)
              if (player.who === "0x0000000000000000000000000000000000000000" && player.taps.toString() === "0") {
                 return null;
              }
              
              return (
                <div 
                  key={index} 
                  className={`flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800 last:border-0 ${player.who === address ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {truncateAddress(player.who)}
                      {player.who === address && <span className="ml-2 text-xs text-green-500">(You)</span>}
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{player.taps.toString()}</span>
                </div>
              );
            })}
            
            {(!leaderboard || leaderboard[0].taps.toString() === "0") && (
              <div className="p-4 text-center text-sm text-gray-500">
                Belum ada pemain. Jadilah yang pertama!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PageCelosGame;
