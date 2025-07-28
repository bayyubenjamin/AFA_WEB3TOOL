import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLandmark, faArrowLeft, faPlus, faEdit, faTrash, faSave, faSpinner, faCopy, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Pastikan ini mengimpor dan menginisialisasi Supabase dengan benar

// Komponen form untuk menambah atau mengedit metode pembayaran
const MethodForm = ({ method, onSave, onCancel, isSaving }) => {
    // State untuk data form, diinisialisasi dengan data method jika ada (untuk edit)
    const [formData, setFormData] = useState({
        name: method?.name || '',
        account_name: method?.account_name || '',
        account_number: method?.account_number || '',
    });

    // Handle perubahan input form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        // Validasi semua kolom harus diisi
        if (!formData.name || !formData.account_name || !formData.account_number) {
            console.error('Semua kolom wajib diisi.');
            // TODO: Tampilkan pesan ini di dalam form menggunakan state lokal untuk UX yang lebih baik
            return;
        }
        onSave(formData); // Panggil fungsi onSave dari parent
    };

    return (
        <form onSubmit={handleSubmit} className="bg-light-bg dark:bg-dark-bg p-4 rounded-lg my-4 border border-primary/30 space-y-3">
            <h3 className="font-bold text-lg mb-2">{method ? 'Edit Rekening' : 'Tambah Rekening Baru'}</h3>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nama Bank / E-Wallet (cth: BCA)" className="input-file w-full rounded" />
            <input type="text" name="account_name" value={formData.account_name} onChange={handleChange} placeholder="Nama Pemilik Rekening" className="input-file w-full rounded" />
            <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} placeholder="Nomor Rekening / E-Wallet" className="input-file w-full rounded" />
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="btn-secondary text-sm rounded">Batal</button>
                <button type="submit" disabled={isSaving} className="btn-primary text-sm rounded">
                    {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faSave} className="mr-2"/> Simpan</>}
                </button>
            </div>
        </form>
    );
};

// Komponen utama halaman Pengaturan Rekening Admin
export default function PageAdminRekening() {
    const [methods, setMethods] = useState([]); // State untuk daftar metode pembayaran
    const [isLoading, setIsLoading] = useState(true); // State untuk indikator loading
    const [isSaving, setIsSaving] = useState(false); // State untuk indikator saving
    const [error, setError] = useState(''); // State untuk pesan error
    const [showForm, setShowForm] = useState(false); // State untuk menampilkan/menyembunyikan form
    const [editingMethod, setEditingMethod] = useState(null); // State untuk metode yang sedang diedit
    const [networkConfigId, setNetworkConfigId] = useState(null); // ID dari baris konfigurasi jaringan
    const [userId, setUserId] = useState(null); // State untuk menyimpan ID pengguna yang terautentikasi

    // Ambil ID pengguna yang terautentikasi saat komponen dimuat
    useEffect(() => {
        const fetchUserAndAuth = async () => {
            setIsLoading(true); // Mulai loading
            setError(''); // Bersihkan error sebelumnya

            // Pastikan klien Supabase ada sebelum mencoba menggunakannya
            if (!supabase) {
                console.error("Kesalahan konfigurasi: Klien Supabase tidak tersedia.");
                setError("Kesalahan konfigurasi: Klien Supabase tidak tersedia.");
                setIsLoading(false);
                return;
            }

            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError) {
                    console.error("Gagal mendapatkan pengguna terautentikasi:", authError);
                    setError("Gagal mengambil status login: " + authError.message);
                    setUserId(null); // Pastikan userId null jika ada error
                } else if (user) {
                    setUserId(user.id);
                } else {
                    setError("Pengguna belum login. Silakan login untuk mengelola rekening.");
                    setUserId(null); // Pastikan userId null jika tidak ada user
                }
            } catch (e) {
                console.error("Terjadi kesalahan tak terduga saat memuat pengguna dari Supabase:", e);
                setError("Terjadi kesalahan tak terduga saat memuat pengguna.");
                setUserId(null); // Pastikan userId null jika ada error tak terduga
            } finally {
                setIsLoading(false); // Selalu hentikan loading, terlepas dari sukses atau gagal
            }
        };

        fetchUserAndAuth();

        // Berlangganan perubahan status autentikasi untuk memastikan userId selalu up-to-date
        // PERBAIKAN: Mengakses `subscription` dari objek `data`
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                setUserId(null);
                setMethods([]); // Hapus metode jika pengguna logout
                setError("Pengguna telah logout atau belum login.");
            }
        });

        // Cleanup listener saat komponen unmount
        return () => {
            if (authListener) { // Pastikan listener ada sebelum unsubscribe
                authListener.unsubscribe();
            }
        };
    }, []); // Array dependensi kosong berarti efek ini hanya berjalan sekali saat komponen mount

    // Fungsi untuk mengambil metode pembayaran dari Supabase
    // Menggunakan useCallback agar tidak dibuat ulang setiap render kecuali dependensi berubah
    const fetchMethods = useCallback(async () => {
        // Jangan ambil data jika userId belum tersedia atau Supabase belum diinisialisasi
        if (!userId || !supabase) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(''); // Hapus error sebelumnya

        try {
            // Ambil baris konfigurasi jaringan spesifik untuk pengguna saat ini
            const { data, error } = await supabase
                .from('warung_jaringan')
                .select('id, payment_method')
                .eq('user_id', userId) // PENTING: Filter berdasarkan user_id
                .limit(1)
                .single();

            if (data) {
                setMethods(data.payment_method || []);
                setNetworkConfigId(data.id);
            } else if (error && error.code === 'PGRST116') { // Error 'PGRST116' berarti tidak ada baris ditemukan (ini normal)
                setMethods([]);
                setNetworkConfigId(null);
            } else if (error) {
                console.error("Gagal memuat metode pembayaran:", error);
                setError("Gagal memuat data: " + error.message);
            }
        } catch (e) {
            console.error("Terjadi kesalahan saat mengambil metode pembayaran:", e);
            setError("Terjadi kesalahan tak terduga saat memuat data rekening.");
        } finally {
            setIsLoading(false);
        }
    }, [userId]); // Panggil ulang fetchMethods saat userId berubah

    // Panggil fetchMethods saat komponen dimuat atau saat userId tersedia
    useEffect(() => {
        if (userId) { // Hanya fetch jika userId sudah ada
            fetchMethods();
        }
    }, [fetchMethods, userId]);

    // Fungsi untuk menyimpan (menambah atau mengedit) metode pembayaran
    const handleSave = async (formData) => {
        if (!userId) {
            console.error("Tidak ada user ID. Tidak dapat menyimpan.");
            setError("Anda harus login untuk menyimpan rekening.");
            return;
        }
        if (!supabase) {
            console.error("Klien Supabase tidak tersedia. Tidak dapat menyimpan.");
            setError("Kesalahan: Klien Supabase tidak tersedia.");
            return;
        }

        setIsSaving(true);
        let updatedMethods;
        if (editingMethod) {
            // Mode edit: Perbarui metode yang cocok
            updatedMethods = methods.map(m => m.account_number === editingMethod.account_number ? { ...m, ...formData } : m);
        } else {
            // Mode tambah baru: Periksa duplikasi nomor rekening
            if (methods.some(m => m.account_number === formData.account_number)) {
                console.error('Nomor rekening ini sudah ada.');
                setError('Nomor rekening ini sudah ada.'); // Tampilkan error ke pengguna
                setIsSaving(false);
                return;
            }
            updatedMethods = [...methods, formData];
        }

        let dbError;
        try {
            if (networkConfigId) {
                // Jika sudah ada konfigurasi untuk user ini, UPDATE kolom payment_method
                const { error: updateError } = await supabase
                    .from('warung_jaringan')
                    .update({ payment_method: updatedMethods })
                    .eq('id', networkConfigId)
                    .eq('user_id', userId); // PENTING: Pastikan mengupdate baris milik user ini
                dbError = updateError;
            } else {
                // Jika belum ada konfigurasi untuk user ini (pertama kali), INSERT baris baru
                const { error: insertError } = await supabase
                    .from('warung_jaringan')
                    .insert({
                        user_id: userId, // PENTING: Tambahkan user_id di sini
                        name: 'Konfigurasi Jaringan Pengguna', // Anda bisa membuat ini dinamis atau lebih deskriptif
                        is_active: true, // Default ke true
                        payment_method: updatedMethods,
                        tokens: [] // Asumsi tokens adalah array kosong pada awalnya
                    });
                dbError = insertError;
            }
        } catch (e) {
            console.error("Terjadi kesalahan saat menyimpan data ke Supabase:", e);
            dbError = { message: "Terjadi kesalahan tak terduga saat menyimpan data." };
        }
        
        if (dbError) {
            console.error('Gagal menyimpan perubahan:', dbError.message);
            setError('Gagal menyimpan perubahan: ' + dbError.message);
        } else {
            setMethods(updatedMethods);
            setShowForm(false);
            setEditingMethod(null);
            setError(''); // Hapus error setelah berhasil
            fetchMethods(); // Muat ulang data untuk mendapatkan ID baru jika ini adalah insert pertama
        }
        setIsSaving(false);
    };

    // Fungsi untuk menghapus metode pembayaran
    const handleDelete = async (accountNumber) => {
        // PERINGATAN: window.confirm TIDAK AKAN BEKERJA di lingkungan Canvas.
        // Ganti dengan modal kustom Anda sendiri untuk konfirmasi.
        const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?');
        if (!confirmDelete) {
            return;
        }

        if (!userId || !networkConfigId) {
            console.error("Tidak ada user ID atau networkConfigId. Tidak dapat menghapus.");
            setError("Anda harus login dan memiliki konfigurasi untuk menghapus rekening.");
            return;
        }
        if (!supabase) {
            console.error("Klien Supabase tidak tersedia. Tidak dapat menghapus.");
            setError("Kesalahan: Klien Supabase tidak tersedia.");
            return;
        }

        const updatedMethods = methods.filter(m => m.account_number !== accountNumber);
        setIsSaving(true);
        setError(''); // Hapus error sebelumnya

        try {
            const { error: deleteError } = await supabase
                .from('warung_jaringan')
                .update({ payment_method: updatedMethods })
                .eq('id', networkConfigId)
                .eq('user_id', userId); // PENTING: Pastikan menghapus dari baris milik user ini
            
            if (deleteError) {
                console.error('Gagal menghapus:', deleteError.message);
                setError('Gagal menghapus: ' + deleteError.message);
            } else {
                setMethods(updatedMethods);
            }
        } catch (e) {
            console.error("Terjadi kesalahan saat menghapus data dari Supabase:", e);
            setError("Terjadi kesalahan tak terduga saat menghapus rekening.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="page-content space-y-6 py-8 max-w-4xl mx-auto p-4 md:p-0">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <FontAwesomeIcon icon={faLandmark} /> Pengaturan Rekening Admin
                </h1>
                <Link to="/admin" className="btn-secondary text-sm rounded">
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Kembali ke Dashboard
                </Link>
            </div>

            {/* Menampilkan loading jika isLoading true dan belum ada error */}
            {isLoading && !error ? (
                <div className="text-center p-8">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                    <p className="mt-2">Memuat data atau menunggu autentikasi...</p>
                </div>
            ) : error ? (
                // Menampilkan pesan error jika ada error
                <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center justify-between">
                    <span>Error: {error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
            ) : (
                // Menampilkan konten utama saat tidak loading dan tidak ada error
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border p-5 rounded-lg shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                        <h2 className="text-lg font-bold">Daftar Metode Pembayaran</h2>
                        <button onClick={() => { setEditingMethod(null); setShowForm(true); }} className="btn-primary text-sm rounded">
                            <FontAwesomeIcon icon={faPlus} className="mr-2"/> Tambah Rekening
                        </button>
                    </div>

                    {/* Menampilkan form jika showForm true */}
                    {showForm && (
                        <MethodForm
                            method={editingMethod}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingMethod(null); setError(''); }}
                            isSaving={isSaving}
                        />
                    )}

                    <div className="space-y-3">
                        {methods.length > 0 ? methods.map((method, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-light-bg dark:bg-dark-bg rounded-md shadow-sm">
                                <div className="mb-2 sm:mb-0">
                                    <p className="font-bold text-base">{method.name} - <span className="font-mono">{method.account_number}</span></p>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">a/n {method.account_name}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingMethod(method); setShowForm(true); setError(''); }} className="btn-secondary-outline text-sm p-2 rounded">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button onClick={() => handleDelete(method.account_number)} disabled={isSaving} className="btn-danger text-sm p-2 rounded">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-6">
                                Belum ada metode pembayaran yang ditambahkan.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

