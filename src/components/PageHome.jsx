// src/components/PageHome.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFingerprint, // Untuk AFA Identity
  faRocket,      // Untuk Jelajahi Airdrop
  faTasks,       // Untuk Kelola Garapan
  faComments,    // Untuk Forum Komunitas
  faArrowRight   // Untuk tombol CTA kecil
} from "@fortawesome/free-solid-svg-icons";

export default function PageHome({ onMintNft, navigateTo }) {
  const features = [
    {
      icon: faRocket,
      title: "Airdrop Terbaru",
      description: "Temukan dan ikuti partisipasi dalam airdrop dari proyek Web3 paling menjanjikan.",
      actionText: "Jelajahi Airdrop",
      actionTarget: "airdrops",
      color: "text-purple-400", // Contoh warna aksen
    },
    {
      icon: faTasks,
      title: "Kelola Garapan",
      description: "Lacak semua progres garapan airdrop Anda dengan mudah di satu tempat terpusat.",
      actionText: "Lihat Garapanku",
      actionTarget: "myWork",
      color: "text-blue-400", // Contoh warna aksen
    },
    {
      icon: faComments,
      title: "Forum Komunitas",
      description: "Bergabunglah dengan komunitas, diskusi, dan dapatkan tips terbaru seputar airdrop.",
      actionText: "Kunjungi Forum",
      actionTarget: "forum",
      color: "text-teal-400", // Contoh warna aksen
    },
  ];

  return (
    <section id="home" className="page-content space-y-12 md:space-y-16 py-8 md:py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
          <span className="futuristic-text-gradient">Maksimalkan</span> Potensi 
          <span className="text-primary"> Airdrop Anda</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
          Selamat datang di <strong>AIRDROP FOR ALL</strong>! Platform terpadu untuk menemukan, mengelola, dan mengklaim airdrop Web3 dengan lebih cerdas dan efisien.
        </p>
        <div className="pt-4">
          <button
            onClick={onMintNft}
            className="btn-primary text-white font-semibold py-3 px-8 md:py-4 md:px-10 rounded-lg text-lg md:text-xl shadow-xl transform hover:scale-105 transition-transform duration-300 inline-flex items-center"
          >
            <FontAwesomeIcon icon={faFingerprint} className="mr-3 h-5 w-5" />
            Mint AFA Identity Anda
          </button>
        </div>
      </div>

      {/* Fitur Utama Section */}
      <div className="space-y-10 px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2">
            Di <span className="text-primary">AFA WEB3TOOL</span>?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Kami menyediakan semua yang Anda butuhkan untuk sukses di dunia airdrop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="card rounded-xl p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col"
              // style={{ borderColor: feature.color.replace('text-', '') }} // Jika ingin border berwarna
            >
              <div className={`mb-4 text-3xl ${feature.color}`}>
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 text-white`}>{feature.title}</h3>
              <p className="text-gray-400 text-sm mb-4 flex-grow">{feature.description}</p>
              <button
                onClick={() => navigateTo(feature.actionTarget)}
                className={`mt-auto btn-secondary text-sm py-2 px-4 rounded-md w-full hover:bg-primary/20 hover:text-primary transition-colors duration-200 flex items-center justify-center group`}
              >
                {feature.actionText}
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-3 w-3 transform transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* (Opsional) Ajakan Bergabung atau Info Tambahan */}
      <div className="text-center pt-8 px-4">
        <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4">
          Siap Memulai Perjalanan Airdrop Anda?
        </h3>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Jangan lewatkan. Bergabunglah dengan Airdrop For All sekarang!
        </p>
        {/* Bisa tambahkan tombol navigasi ke halaman register/login jika ada, atau ulangi CTA mint */}
        <button
          onClick={onMintNft} // Atau navigasi ke halaman airdrops
          className="btn-primary text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg"
        >
          Mulai Sekarang
        </button>
      </div>
    </section>
  );
}
