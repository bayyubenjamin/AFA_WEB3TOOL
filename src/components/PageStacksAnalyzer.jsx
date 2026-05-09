// src/components/PageStacksAnalyzer.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faSpinner, faArrowLeft, faChartPie, faSearch } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

export default function PageStacksAnalyzer({ currentUser }) {
    const [address, setAddress] = useState(currentUser?.stacks_address || "");
    const [balances, setBalances] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWalletData = async (targetAddress) => {
        if (!targetAddress) return;
        setLoading(true);
        setError(null);
        try {
            // Mengambil data saldo dari API Hiro (Stacks Mainnet)
            const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${targetAddress}/balances`);
            if (!res.ok) throw new Error("Gagal mengambil data wallet. Pastikan alamat valid.");
            const data = await res.json();
            setBalances(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (address) {
            fetchWalletData(address);
        }
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchWalletData(address);
    };

    // Konversi micro-STX ke STX (1 STX = 1,000,000 micro-STX)
    const stxBalance = balances?.stx?.balance ? (parseInt(balances.stx.balance) / 1000000).toFixed(6) : "0.000000";

    return (
        <section className="page-content py-8 max-w-4xl mx-auto px-4">
            <div className="mb-6 flex items-center gap-4">
                <Link to="/profile" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <FontAwesomeIcon icon={faChartPie} className="text-primary" />
                    Stacks Wallet Analyzer
                </h1>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faWallet} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Masukkan Alamat Stacks (contoh: SP3...)"
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-3 pl-10 pr-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button type="submit" disabled={loading || !address} className="btn-primary text-white px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg disabled:opacity-50">
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
                    </button>
                </form>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                    {error}
                </div>
            )}

            {balances && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kartu Saldo STX */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
                        <p className="text-orange-100 text-sm font-bold uppercase tracking-wider mb-2">Total Balance (STX)</p>
                        <h2 className="text-4xl font-bold">{stxBalance} <span className="text-xl font-medium">STX</span></h2>
                        <div className="mt-4 pt-4 border-t border-orange-400/50 flex justify-between text-sm">
                            <span>Locked: {balances?.stx?.locked ? (parseInt(balances.stx.locked) / 1000000).toFixed(2) : "0"} STX</span>
                        </div>
                    </div>

                    {/* Kartu Detail Token Fungible */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            Fungible Tokens
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                            {Object.keys(balances?.fungible_tokens || {}).length > 0 ? (
                                Object.entries(balances.fungible_tokens).map(([key, token], idx) => {
                                    const tokenName = key.split('::')[1] || "Unknown Token";
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm truncate max-w-[60%]">{tokenName}</span>
                                            <span className="font-mono text-primary text-sm font-bold">{token.balance}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-slate-500 text-sm text-center py-4">Tidak ada token ditemukan.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
