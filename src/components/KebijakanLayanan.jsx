import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KebijakanLayanan = () => {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);

  // Fungsi navigasi
  const handleBackToWarung = () => {
    navigate('/warung-kripto');
  };

  return (
    <div style={styles.pageWrapper}>
      {/* === TOP NAVIGATION BAR === */}
      <nav style={styles.navbar}>
        <div style={styles.navContainer}>
          <button 
            onClick={handleBackToWarung}
            style={styles.backButton}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.05)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ← Kembali ke Warung
          </button>
          <span style={styles.navBrand}>Warung Kripto AFA</span>
        </div>
      </nav>

      {/* === CONTENT CONTAINER === */}
      <div style={styles.container}>
        
        {/* HEADER SECTION */}
        <div style={styles.headerSection}>
          <span style={styles.badge}>Updated: Desember 2025</span>
          <h1 style={styles.title}>Kebijakan & Ketentuan Layanan</h1>
          <p style={styles.subtitle}>
            Pedoman operasional, batasan tanggung jawab, dan kepatuhan hukum untuk inisiatif komunitas Warung Kripto AFA.
          </p>
        </div>

        {/* CONTENT CARD */}
        <div style={styles.card}>
          
          {/* PASAL 1 */}
          <section style={styles.section}>
            <h2 style={styles.heading2}>1. Misi, Definisi, dan Ruang Lingkup</h2>
            <p style={styles.text}>
              Dokumen ini mengatur penggunaan layanan yang difasilitasi oleh <strong style={styles.bold}>Warung Kripto AFA</strong> ("AFA"), 
              sebuah inisiatif komunitas independen yang bertujuan menjembatani adopsi Web3 di tingkat mikro.
            </p>
            
            <div style={styles.blueBox}>
              <h3 style={styles.boxTitle}>⚠️ Batasan Operasional Layanan (Micro-Transaction Only)</h3>
              <p style={styles.text}>
                Layanan ini <strong>KHUSUS</strong> ditujukan untuk kebutuhan esensial skala kecil (mikro) dengan rentang transaksi:
                <br />
                <span style={styles.highlightVal}>Rp 10.000,- s/d Rp 1.000.000,- per transaksi.</span>
              </p>
              <p style={styles.textSmall}>
                Tujuan penggunaan dana terbatas pada: Pembayaran <i>Gas Fee</i>, syarat partisipasi komunitas (airdrop), 
                dan edukasi awal. <strong>AFA menolak keras</strong> penggunaan layanan untuk spekulasi pasar (trading) 
                volume besar atau pencucian uang.
              </p>
            </div>
          </section>

          <hr style={styles.divider} />

          {/* PASAL 2 */}
          <section style={styles.section}>
            <h2 style={styles.heading2}>2. Status Hukum & Transisi Regulasi 2025</h2>
            <div style={styles.amberBox}>
              <h3 style={styles.boxTitleAmber}>Pernyataan Non-Afiliasi Lembaga Keuangan</h3>
              <p style={styles.text}>
                Warung Kripto AFA beroperasi sebagai <strong>Inisiatif Komunitas (Community-Led)</strong> dan dengan tegas menyatakan:
              </p>
              <ul style={styles.list}>
                <li><strong>BUKAN</strong> Pedagang Fisik Aset Kripto (PFAK).</li>
                <li><strong>BUKAN</strong> Bursa/Exchange yang terdaftar di Bappebti atau OJK.</li>
                <li>Hanya memfasilitasi pertukaran langsung (Direct Swap) skala mikro antar anggota komunitas.</li>
              </ul>
            </div>
          </section>

          <hr style={styles.divider} />

          {/* PASAL 3 */}
          <section style={styles.section}>
            <h2 style={styles.heading2}>3. Dasar Hukum & Kepatuhan (Update Des 2025)</h2>
            <p style={styles.text}>
              Kami menghormati kerangka hukum Republik Indonesia. Operasional kami merujuk pada interpretasi peraturan terkini, termasuk masa transisi pengawasan aset digital:
            </p>
            <ul style={styles.list}>
              <li>
                <strong>UU No. 4 Tahun 2023 (UU P2SK):</strong> Tentang Pengembangan dan Penguatan Sektor Keuangan, yang memandatkan peralihan pengawasan aset kripto ke Otoritas Jasa Keuangan (OJK).
              </li>
              <li>
                <strong>Peraturan Bappebti No. 8 Tahun 2021:</strong> Pedoman dasar perdagangan aset kripto.
              </li>
              <li>
                <strong>PMK No. 68/PMK.03/2022:</strong> Ketentuan PPN dan PPh aset kripto.
              </li>
            </ul>
            <p style={{...styles.textSmall, marginTop: '15px', color: '#64748b'}}>
              <em>*Catatan: Karena AFA bukan entitas PFAK resmi, kami tidak memiliki wewenang memungut PPh Pasal 22 Final secara otomatis. Pelaporan pajak atas keuntungan investasi adalah tanggung jawab pribadi Pengguna (Self-Assessment).</em>
            </p>
          </section>

          <hr style={styles.divider} />

          {/* PASAL 4 & 5 */}
          <section style={styles.section}>
            <h2 style={styles.heading2}>4. Risiko & Tanggung Jawab Pengguna</h2>
            <div style={styles.gridTwo}>
              <div style={styles.gridItem}>
                <h4 style={styles.heading4}>Volatilitas Ekstrem</h4>
                <p style={styles.textSmall}>
                  Nilai aset dapat berubah drastis dalam hitungan detik. Rate dikunci saat konfirmasi transfer.
                </p>
              </div>
              <div style={styles.gridItem}>
                <h4 style={styles.heading4}>Keamanan Digital</h4>
                <p style={styles.textSmall}>
                  Pengguna bertanggung jawab penuh atas keamanan <em>Private Key</em> dan alamat dompet (Wallet Address) tujuan.
                </p>
              </div>
              <div style={styles.gridItem}>
                <h4 style={styles.heading4}>Anti Money Laundering (AML)</h4>
                <p style={styles.textSmall}>
                  Kami berhak membekukan transaksi jika terdeteksi alamat dompet yang berafiliasi dengan aktivitas ilegal/kriminal.
                </p>
              </div>
              <div style={styles.gridItem}>
                <h4 style={styles.heading4}>Irreversibility</h4>
                <p style={styles.textSmall}>
                  Transaksi blockchain tidak dapat dibatalkan. Kesalahan input alamat oleh pengguna tidak dapat direfund.
                </p>
              </div>
            </div>
          </section>

          <hr style={styles.divider} />

          {/* FINAL DISCLAIMER */}
          <section style={{...styles.section, marginBottom: 0}}>
            <h2 style={styles.heading2}>5. Persetujuan & Disclaimer</h2>
            <p style={styles.text}>
              Dengan menekan tombol transaksi atau menggunakan layanan ini, Anda menyatakan telah berusia di atas 18 tahun, cakap hukum, dan membebaskan Warung Kripto AFA dari segala tuntutan kerugian finansial yang mungkin timbul.
            </p>
            <p style={styles.text}>
              Layanan disediakan <strong>"AS IS" (Sebagaimana Adanya)</strong> tanpa jaminan keuntungan.
            </p>
          </section>

        </div>

        {/* FOOTER */}
        <footer style={styles.footer}>
          <p style={styles.footerText}>&copy; 2025 Warung Kripto AFA. All Rights Reserved.</p>
          <p style={styles.footerSubText}>
            Community Initiative • Web3 Education • Micro Transactions
          </p>
        </footer>

      </div>
    </div>
  );
};

// Styles Object - Professional Clean Look (CSS-in-JS)
const styles = {
  pageWrapper: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: '#f1f5f9', // Slate-100
    minHeight: '100vh',
    color: '#334155', // Slate-700
    paddingBottom: '40px',
  },
  navbar: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #e2e8f0',
    padding: '15px 0',
    zIndex: 1000,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  navContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#0f172a',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  navBrand: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: '1rem',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 20px',
  },
  headerSection: {
    textAlign: 'center',
    padding: '50px 0 40px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#dbeafe', // Blue-100
    color: '#1e40af', // Blue-800
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '99px',
    marginBottom: '15px',
    letterSpacing: '0.5px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#0f172a', // Slate-900
    marginBottom: '15px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748b', // Slate-500
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e2e8f0',
    padding: '40px',
    marginBottom: '40px',
  },
  section: {
    marginBottom: '30px',
  },
  heading2: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    fontSize: '1rem',
    lineHeight: 1.7,
    marginBottom: '15px',
    textAlign: 'justify',
  },
  textSmall: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: '#475569',
  },
  bold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  blueBox: {
    backgroundColor: '#eff6ff', // Blue-50
    borderLeft: '4px solid #3b82f6', // Blue-500
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px',
  },
  amberBox: {
    backgroundColor: '#fffbeb', // Amber-50
    borderLeft: '4px solid #f59e0b', // Amber-500
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px',
  },
  boxTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: '10px',
    marginTop: 0,
  },
  boxTitleAmber: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#92400e',
    marginBottom: '10px',
    marginTop: 0,
  },
  highlightVal: {
    fontWeight: '700',
    color: '#1d4ed8',
    fontSize: '1.05rem',
  },
  list: {
    paddingLeft: '20px',
    marginBottom: '15px',
    lineHeight: 1.7,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '30px 0',
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  gridItem: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
  },
  heading4: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '8px',
    marginTop: 0,
  },
  footer: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0',
  },
  footerText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '5px',
  },
  footerSubText: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
};

export default KebijakanLayanan;
