import React from 'react';
import { useNavigate } from 'react-router-dom';

// Halaman Utama Kebijakan Layanan
const KebijakanLayanan = () => {
  // Hook untuk navigasi
  const navigate = useNavigate();

  // Fungsi untuk kembali ke halaman warung kripto
  const handleBackToWarung = () => {
    navigate('/warung-kripto');
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.h1}>Kebijakan dan Ketentuan Layanan</h1>
          <p style={styles.headerP}>Warung Kripto AFA (Inisiatif Komunitas)</p>
          <p style={styles.headerP}>Berlaku Efektif: 29 Juli 2025</p>
        </div>

        {/* === KONTEN UTAMA (SAMA SEPERTI HTML ASLI) === */}
        <h2 style={styles.h2}>Pasal 1: Misi, Definisi, dan Ruang Lingkup</h2>
        <p style={styles.p}>
          Dokumen ini mengatur penggunaan layanan yang difasilitasi oleh{' '}
          <b style={styles.strong}>Warung Kripto AFA</b> ("AFA", "Kami"),
          sebuah inisiatif komunitas yang didirikan dengan misi utama untuk
          menjembatani pengguna dari ekosistem Web2 ke Web3.
        </p>
        <div style={styles.infoBox}>
          <strong style={styles.infoBoxStrong}>
            Tujuan Utama dan Batasan Operasional Layanan
          </strong>
          <p style={styles.p}>
            Tujuan fundamental AFA adalah menyediakan solusi bagi pengguna
            pemula yang memerlukan{' '}
            <b style={styles.strong}>
              Aset Kripto dalam jumlah sangat kecil (skala mikro)
            </b>{' '}
            untuk kebutuhan esensial di dunia Web3. Layanan kami secara
            spesifik ditujukan untuk memfasilitasi transaksi dengan rentang
            nilai antara{' '}
            <b style={styles.strong}>
              Rp 10.000,- (sepuluh ribu rupiah) hingga Rp 1.000.000,- (satu
              juta rupiah)
            </b>{' '}
            per transaksi, untuk keperluan seperti:
          </p>
          <ul style={styles.ul}>
            <li style={styles.li}>
              Pembayaran biaya jaringan (<i>gas fee</i>).
            </li>
            <li style={styles.li}>
              Pemenuhan syarat minimal untuk berpartisipasi dalam aktivitas
              komunitas seperti <i>airdrop</i>.
            </li>
            <li style={styles.li}>
              Edukasi dan percobaan awal bagi pengguna baru di jaringan
              blockchain.
            </li>
          </ul>
          <p style={styles.p}>
            AFA tidak dirancang untuk aktivitas perdagangan (<i>trading</i>)
            profesional, investasi, atau transaksi komersial bervolume
            besar.
          </p>
        </div>
        <p style={styles.p}>
          Untuk mempermudah pemahaman, peran Warung Kripto AFA dapat
          dianalogikan seperti{' '}
          <b style={styles.strong}>toko emas di pasar tradisional</b> yang
          melayani jual-beli emas dalam skala kecil. Dalam konteks digital
          ini, AFA melakukan transaksi jual-beli Aset Kripto secara langsung
          dengan Pengguna, bukan sebagai perantara antar pengguna (
          <i>peer-to-peer</i>). Seluruh transaksi dilakukan antara Pengguna
          dan pihak pengelola (admin) AFA.
        </p>
        <h3 style={styles.h3}>Definisi Kunci</h3>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <b style={styles.strong}>Layanan Transaksi Langsung:</b>{' '}
            Aktivitas utama AFA, yaitu menyediakan akses bagi Pengguna untuk
            membeli dari atau menjual kepada AFA (diwakili oleh admin) Aset
            Kripto dalam nominal kecil.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>Aset Kripto:</b> Aset digital
            terdesentralisasi yang transaksinya dicatat pada jaringan
            blockchain.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>Nilai Tukar Real-Time:</b> Harga
            konversi antara Aset Kripto dan Rupiah (IDR) yang digunakan dalam
            transaksi. Nilai ini didasarkan pada data harga dari API pihak
            ketiga yang independen, yaitu <b style={styles.strong}>CoinGecko</b>,
            dengan kemungkinan penyesuaian kecil untuk biaya layanan (
            <i>spread</i>).
          </li>
        </ul>
        <p style={styles.p}>
          Dengan mengakses layanan kami, Anda ("Pengguna") menyatakan telah
          membaca, memahami, dan menyetujui seluruh ketentuan dalam dokumen
          ini.
        </p>

        <h2 style={styles.h2}>Pasal 2: Status Hukum dan Sifat Layanan</h2>
        <div style={styles.highlightBox}>
          <strong style={styles.highlightBoxStrong}>
            Penegasan Status Non-Resmi
          </strong>
          <p style={styles.p}>
            Warung Kripto AFA adalah{' '}
            <b style={styles.strong}>inisiatif komunitas</b> yang beroperasi
            atas dasar gotong royong dan itikad baik. Kami secara tegas
            menyatakan bahwa AFA:
            <br />
            1. <b style={styles.strong}>BUKAN</b> Pedagang Fisik Aset Kripto
            (PFAK) atau Calon PFAK.
            <br />
            2. <b style={styles.strong}>BUKAN</b> Penyelenggara Perdagangan
            Melalui Sistem Elektronik (PPMSE) atau <i>Exchanger</i> resmi.
            <br />
            3. <b style={styles.strong}>BUKAN</b> Lembaga Jasa Keuangan (LJK)
            yang diawasi oleh Otoritas Jasa Keuangan (OJK).
            <br />
            4. <b style={styles.strong}>TIDAK</b> menyediakan jasa penasihat
            keuangan, investasi, atau memberikan janji keuntungan (
            <i>profit</i>).
          </p>
        </div>
        <p style={styles.p}>
          Aktivitas AFA terbatas pada transaksi langsung antara Pengguna dan
          admin. AFA tidak menyimpan dana atau Aset Kripto milik Pengguna
          dalam bentuk apa pun (non-custodial). Seluruh transaksi dilakukan
          secara instan dan langsung antar dompet Pengguna dan dompet admin
          AFA.
        </p>

        <h2 style={styles.h2}>Pasal 3: Tinjauan dan Dasar Hukum</h2>
        <p style={styles.p}>
          AFA mengakui dan menghormati kerangka hukum yang berlaku di
          Republik Indonesia. Status dan operasional kami didasarkan pada
          interpretasi atas peraturan berikut:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <b style={styles.strong}>Undang-Undang No. 10 Tahun 2011</b>{' '}
            tentang Perdagangan Berjangka Komoditi.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>
              Peraturan Bappebti No. 8 Tahun 2021
            </b>{' '}
            tentang Pedoman Penyelenggaraan Perdagangan Pasar Fisik Aset
            Kripto.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>
              Peraturan Menteri Keuangan (PMK) No. 68/PMK.03/2022
            </b>{' '}
            tentang PPN dan PPh atas Transaksi Perdagangan Aset Kripto.
          </li>
        </ul>
        <ol style={styles.ol}>
          <li style={styles.li}>
            Sesuai regulasi Bappebti, entitas yang menyelenggarakan
            perdagangan Aset Kripto untuk tujuan komersial wajib terdaftar
            sebagai PFAK. Dengan batasan operasional pada Pasal 1, AFA tidak
            memenuhi kriteria dan tidak beroperasi sebagai PFAK.
          </li>
          <li style={styles.li}>
            Konsekuensinya, merujuk pada PMK 68/2022, kewajiban pemungutan
            PPh Pasal 22 Final hanya melekat pada PFAK. Karena AFA bukan
            PFAK, kami <b style={styles.strong}>
              tidak memiliki wewenang hukum maupun kewajiban
            </b>{' '}
            untuk memungut pajak tersebut.
          </li>
        </ol>

        <h2 style={styles.h2}>Pasal 4: Tanggung Jawab Pajak Pengguna</h2>
        <div
          style={{
            ...styles.infoBox,
            backgroundColor: '#e2e3e5',
            borderLeftColor: '#6c757d',
          }}
        >
          <strong style={{ color: '#343a40' }}>Kewajiban Pajak Pribadi</strong>
          <p style={styles.p}>
            <b style={styles.strong}>
              Kewajiban pelaporan dan pembayaran pajak
            </b>{' '}
            yang mungkin timbul dari keuntungan (<i>capital gain</i>) atau
            penghasilan lain dari transaksi Aset Kripto merupakan{' '}
            <b style={styles.strong}>
              tanggung jawab penuh Pengguna sebagai Wajib Pajak pribadi
            </b>
            . Kami sangat menganjurkan Pengguna untuk berkonsultasi dengan
            konsultan pajak profesional.
          </p>
        </div>

        <h2 style={styles.h2}>Pasal 5: Risiko dan Tanggung Jawab Pengguna</h2>
        <p style={styles.p}>
          Pengguna memahami dan menerima sepenuhnya risiko inheren dalam
          penggunaan Aset Kripto, termasuk:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <b style={styles.strong}>Volatilitas Nilai:</b> Harga Aset Kripto
            sangat fluktuatif. Transaksi dieksekusi berdasarkan nilai tukar
            saat konfirmasi.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>Kesalahan Transaksi:</b> Kerugian akibat
            kesalahan Pengguna (misal: salah alamat dompet) adalah tanggung
            jawab Pengguna sepenuhnya.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>Keamanan Pribadi:</b> Pengguna wajib
            menjaga keamanan perangkat, jaringan, dan akses ke dompet
            digitalnya.
          </li>
        </ul>

        <h2 style={styles.h2}>
          Pasal 6: Penyelesaian Sengketa dan Kesalahan Transaksi
        </h2>
        <p style={styles.p}>
          AFA berkomitmen meninjau setiap permasalahan dengan prinsip itikad
          baik dan transparansi.
        </p>
        <ol style={styles.ol}>
          <li style={styles.li}>
            <b style={styles.strong}>Pelaporan:</b> Jika terjadi kesalahan
            transaksi yang diduga disebabkan oleh kelalaian pihak AFA,
            Pengguna wajib segera melapor dengan bukti relevan.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>Investigasi:</b> Tim AFA akan melakukan
            verifikasi berdasarkan catatan internal dan data pada jaringan
            blockchain.
          </li>
          <li style={styles.li}>
            <b style={styles.strong}>Resolusi:</b> Jika kesalahan teknis
            terbukti dari pihak AFA, kompensasi akan diberikan senilai dengan
            kerugian yang tercatat. Kesalahan dari pihak Pengguna tidak
            menjadi tanggung jawab AFA.
          </li>
        </ol>

        <h2 style={styles.h2}>
          Pasal 7: Kelayakan dan Kepatuhan Pengguna
        </h2>
        <h3 style={styles.h3}>Batas Usia</h3>
        <p style={styles.p}>
          Dengan menggunakan layanan ini, Pengguna menyatakan dan menjamin
          bahwa ia berusia <b style={styles.strong}>minimal 18 tahun</b> atau
          telah mencapai usia dewasa sesuai hukum yang berlaku di
          yurisdiksinya, serta memiliki kapasitas hukum penuh untuk terikat
          oleh ketentuan ini.
        </p>
        <h3 style={styles.h3}>Kepatuhan Anti-Pencucian Uang (AML)</h3>
        <p style={styles.p}>
          Pengguna setuju untuk tidak menggunakan layanan AFA untuk tujuan
          ilegal apa pun, termasuk namun tidak terbatas pada pencucian uang,
          pendanaan terorisme, atau penipuan. AFA berhak menolak transaksi
          jika terdapat indikasi kuat adanya aktivitas mencurigakan dan akan
          bersikap kooperatif jika diminta keterangan oleh otoritas yang
          berwenang.
        </p>

        <h2 style={styles.h2}>Pasal 8: Kanal Komunikasi Resmi</h2>
        <p style={styles.p}>
          Segala bentuk pertanyaan, keluhan, atau laporan sengketa terkait
          layanan AFA hanya akan dilayani melalui kanal komunikasi resmi yang
          telah ditentukan. Silakan hubungi kami melalui [Contoh: email di{' '}
          <b style={styles.strong}>dukungan@warungkriptoafa.com</b> atau
          grup Telegram resmi]. Komunikasi di luar kanal tersebut tidak
          dianggap sebagai laporan resmi dan tidak akan ditanggapi.
        </p>

        <h2 style={styles.h2}>Pasal 9: Disclaimer Hukum Akhir</h2>
        <div style={styles.highlightBox}>
          <strong style={styles.highlightBoxStrong}>
            Sangkalan dan Batasan Tanggung Jawab
          </strong>
          <p style={styles.p}>
            Layanan ini disediakan atas dasar "sebagaimana adanya" (
            <i>as is</i>). AFA, para pengelola, dan kontributor komunitas
            tidak bertanggung jawab atas kerugian dalam bentuk apa pun, baik
            langsung maupun tidak langsung, yang timbul dari penggunaan
            layanan ini. Dengan melanjutkan transaksi, Pengguna menyatakan
            memahami seluruh risiko dan membebaskan AFA dari segala bentuk
            tuntutan hukum.
          </p>
        </div>
        
        {/* Tombol untuk kembali ke Warung Kripto */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <button
            onClick={handleBackToWarung}
            style={styles.transactionButton}
          >
            Kembali ke Warung Kripto
          </button>
        </div>

        <div style={styles.footer}>
          <p>&copy; 2025 Warung Kripto AFA (Inisiatif Komunitas)</p>
          <p>
            Dokumen ini disusun untuk tujuan transparansi dan edukasi, bukan
            merupakan nasihat hukum atau keuangan formal.
          </p>
          {/* Footer tambahan yang diminta */}
          <p>warung kripto</p>
        </div>
      </div>
    </div>
  );
};

// Styles diubah menjadi objek JavaScript
const styles = {
  body: {
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.7,
    color: '#343a40',
    backgroundColor: '#f8f9fa',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: '850px',
    margin: '30px auto',
    padding: '45px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
    border: '1px solid #dee2e6',
  },
  header: {
    textAlign: 'center',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '20px',
    marginBottom: '35px',
  },
  h1: {
    fontFamily: "'Lora', serif",
    fontSize: '2.2em',
    color: '#212529',
    margin: 0,
  },
  headerP: {
    marginTop: '8px',
    color: '#6c757d',
    fontSize: '0.95em',
  },
  h2: {
    fontFamily: "'Lora', serif",
    fontSize: '1.6em',
    color: '#343a40',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '12px',
    marginTop: '45px',
  },
  h3: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 700,
    fontSize: '1.15em',
    color: '#495057',
    marginTop: '30px',
  },
  p: {
    textAlign: 'justify',
    fontSize: '1em',
  },
  li: {
    textAlign: 'justify',
    fontSize: '1em',
    marginBottom: '12px',
  },
  ul: {
    paddingLeft: '25px',
  },
  ol: {
    paddingLeft: '25px',
  },
  highlightBox: {
    backgroundColor: '#fff3cd',
    borderLeft: '6px solid #ffc107',
    padding: '20px 25px',
    margin: '25px 0',
    borderRadius: '8px',
  },
  highlightBoxStrong: {
    color: '#856404',
    display: 'block',
    marginBottom: '10px',
    fontSize: '1.1em',
  },
  infoBox: {
    backgroundColor: '#e6f7ff',
    borderLeft: '6px solid #007bff',
    padding: '20px 25px',
    margin: '25px 0',
    borderRadius: '8px',
  },
  infoBoxStrong: {
    color: '#004085',
    display: 'block',
    marginBottom: '10px',
    fontSize: '1.1em',
  },
  footer: {
    textAlign: 'center',
    marginTop: '50px',
    paddingTop: '25px',
    borderTop: '1px solid #e9ecef',
    fontSize: '0.85em',
    color: '#6c757d',
  },
  strong: {
    fontWeight: 700,
    color: '#212529',
  },
  transactionButton: {
    backgroundColor: '#007bff', // Warna biru agar netral
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
  },
};

export default KebijakanLayanan;

