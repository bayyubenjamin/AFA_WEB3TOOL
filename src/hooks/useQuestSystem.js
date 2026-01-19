// src/hooks/useQuestSystem.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const useQuestSystem = (currentUser, isPremium) => {
    const [loading, setLoading] = useState(false);
    const [questData, setQuestData] = useState({
        dailyClaimed: false,
        streak: 0,
        lastClaim: null,
        totalPoints: 0,
        quests: [
            { id: 'q1', title: 'Mint AFA Identity', reward: 500, completed: false, icon: 'id-card' },
            { id: 'q2', title: 'Connect Telegram', reward: 200, completed: false, icon: 'telegram' },
            { id: 'q3', title: 'First Referral', reward: 300, completed: false, icon: 'users' },
        ]
    });

    // Load data from Supabase (Mocking logic for now where DB might not be ready)
    const fetchQuestData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // Simulasi fetch data poin & streak dari tabel 'profiles' atau 'user_quests'
            // Di produksi, ganti ini dengan query Supabase asli
            // const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            
            // Mock data response
            const mockLastClaim = localStorage.getItem(`last_claim_${currentUser.id}`);
            const isClaimedToday = mockLastClaim && new Date(mockLastClaim).toDateString() === new Date().toDateString();
            
            setQuestData(prev => ({
                ...prev,
                dailyClaimed: isClaimedToday,
                streak: parseInt(localStorage.getItem(`streak_${currentUser.id}`) || '0'),
                totalPoints: currentUser.stats?.points || 1250, // Mengambil dari data user yang ada
                quests: prev.quests.map(q => {
                    // Auto-complete logic berdasarkan kondisi user saat ini
                    if (q.id === 'q1' && isPremium) return { ...q, completed: true }; // Cek Premium status
                    if (q.id === 'q2' && currentUser.telegram_user_id) return { ...q, completed: true };
                    return q;
                })
            }));
        } catch (error) {
            console.error("Error fetching quests:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser, isPremium]);

    const handleDailyCheckIn = async () => {
        if (questData.dailyClaimed) return;
        setLoading(true);
        
        // Base reward + Premium Multiplier
        const baseReward = 10;
        const multiplier = isPremium ? 2 : 1;
        const totalReward = baseReward * multiplier;

        try {
            // Simulate API Call delay
            await new Promise(r => setTimeout(r, 800));

            // Update Local State
            const newStreak = questData.streak + 1;
            const newPoints = questData.totalPoints + totalReward;
            
            // Simpan ke LocalStorage (sebagai ganti DB update sementara)
            localStorage.setItem(`last_claim_${currentUser.id}`, new Date().toISOString());
            localStorage.setItem(`streak_${currentUser.id}`, newStreak.toString());

            // Update Supabase (Real implementation)
            /*
            await supabase.from('profiles').update({ 
                points: newPoints,
                last_checkin: new Date() 
            }).eq('id', currentUser.id);
            */

            setQuestData(prev => ({
                ...prev,
                dailyClaimed: true,
                streak: newStreak,
                totalPoints: newPoints
            }));
            
            return { success: true, reward: totalReward };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestData();
    }, [fetchQuestData]);

    return {
        questData,
        loading,
        handleDailyCheckIn,
        refresh: fetchQuestData
    };
};
