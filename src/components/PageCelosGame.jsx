// src/components/PageCelosGame.jsx
import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner'; 

// Address Smart Contract (Ganti jika Anda men-deploy ulang)
const CONTRACT_ADDRESS = "0x8c8328162F53A4241875193B4203A25d290B9B13"; 
import CeloTapGameABI from '../contracts/CeloTapGameABI.json';

const PageCelosGame = () => {
  const { address, isConnected } = useAccount();
  const [isTapping, setIsTapping] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: totalTaps, refetch: refetchTotal } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CeloTapGameABI,
    functionName: 'totalTaps',
  });

  const { data: userTaps, refetch: refetchUser } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CeloTapGameABI,
    functionName: 'getUserTaps',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: leaderboard, refetch: refetchLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CeloTapGameABI,
    functionName: 'getLeaderboard',
  });

  useEffect(() => {
    if (writeError) {
      toast.error(writeError.shortMessage || 'Transaksi Ditolak');
      setIsTapping(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (isConfirmed) {
      refetchTotal();
      refetchUser();
      refetchLeaderboard();
      setIsTapping(false);
      toast.success('Tap Berhasil Dikonfirmasi!');
    }
  }, [isConfirmed, refetchTotal, refetchUser, refetchLeaderboard]);

  const handleTap = async () => {
    if (!isConnected) {
      toast.error('Hubungkan wallet Anda terlebih dahulu!');
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
      setIsTapping(false);
      toast.error('Gagal memproses transaksi');
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isLoading = isPending || isConfirming || isTapping;

  return (
    <div className="container mx-auto px-4 py-8 max-w-md mt-4 pb-24">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            CELOS TAP GAME
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            "Tap di Jaringan Celo. Biaya gas super murah!"
          </p>
        </div>

        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Tap Kamu</p>
            <p className="text-2xl font-bold text-green-500">{userTaps ? userTaps.toString() : '0'}</p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
          <div className="text-center flex-1">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Global</p>
            <p className="text-2xl font-bold text-blue-500">{totalTaps ? totalTaps.toString() : '0'}</p>
          </div>
        </div>

        <div className="flex justify-center mb-10">
          <button
            onClick={handleTap}
            disabled={isLoading}
            className={`w-48 h-48 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-200 border-8 border-white dark:border-gray-700
              ${isLoading 
                ? 'bg-gray-400 scale-95 cursor-not-allowed opacity-70' 
                : 'bg-gradient-to-br from-green-400 to-green-600 hover:scale-105 active:scale-90 shadow-green-500/20'}
            `}
          >
            <span className="text-white text-4xl font-black drop-shadow-md tracking-wider">
              {isConfirming ? 'WAIT...' : isPending ? 'SIGN...' : 'TAP'}
            </span>
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            🏆 <span>Peringkat 10 Besar</span>
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {leaderboard && leaderboard.length > 0 && leaderboard[0].taps.toString() !== "0" ? (
              leaderboard.map((player, index) => {
                if (player.who === "0x0000000000000000000000000000000000000000") return null;
                return (
                  <div key={index} className={`flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800 last:border-0 ${player.who === address ? 'bg-green-500/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold w-6 text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-mono">{truncateAddress(player.who)}</span>
                    </div>
                    <span className="font-bold">{player.taps.toString()}</span>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-gray-500 italic">Belum ada pemain.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageCelosGame;
