// src/utils/airdropData.js

// Kumpulan data airdrop kita. Di aplikasi nyata, ini datang dari database.
const airdrops = [
  { 
    id: 1, 
    slug: "zksync-era-mainnet-airdrop",
    title: "ZK Sync Era Mainnet Airdrop", 
    description: "Airdrop potensial untuk pengguna awal mainnet ZK Sync Era. Lakukan transaksi dan interaksi dengan dApps.", 
    link: "https://zksync.io/", 
    category: "Retroactive", 
    status: "active", 
    image_url: "https://www.cryptoblogs.io/wp-content/uploads/2024/06/What-is-zkSync.jpg", 
    date: "Q4 2025", 
    tutorial: "<h3>Langkah-langkah Partisipasi:</h3><ol><li>Bridge aset ke ZK Sync Era.</li><li>Lakukan swap di DEX seperti SyncSwap atau Mute.io.</li><li>Sediakan likuiditas di salah satu protokol.</li><li>Mint NFT di ZK Sync.</li><li>Berinteraksi secara rutin (mingguan/bulanan).</li></ol>" 
  },
  { 
    id: 2, 
    slug: "layerzero-airdrop",
    title: "LayerZero Airdrop", 
    description: "Protokol interoperabilitas omnichain yang sangat dinantikan. Pengguna awal berpotensi mendapatkan airdrop.", 
    link: "https://layerzero.network/", 
    category: "Retroactive", 
    status: "upcoming", 
    image_url: "https://cdn.betakit.com/wp-content/uploads/2023/04/LayerZero-Labs-770x513.jpg", 
    date: "Q3 2025", 
    tutorial: "<h3>Langkah-langkah Partisipasi:</h3><ol><li>Gunakan Stargate Bridge untuk memindahkan aset antar chain.</li><li>Gunakan dApps lain yang dibangun di atas LayerZero.</li><li>Vote di proposal governance Stargate (jika memiliki token STG).</li></ol>" 
  },
  { 
    id: 3, 
    slug: "starknet-defi-expansion",
    title: "StarkNet DeFi Expansion", 
    description: "Program insentif untuk mendorong penggunaan aplikasi DeFi di ekosistem StarkNet.", 
    link: "https://starknet.io/", 
    category: "Mainnet", 
    status: "active", 
    image_url: "https://pbs.twimg.com/profile_images/1762125355938926592/2i3e25da_400x400.jpg", 
    date: "Ongoing", 
    tutorial: "<h3>Langkah-langkah Partisipasi:</h3><ol><li>Gunakan wallet Argent X atau Braavos.</li><li>Lakukan swap di Starknet DEX seperti Jediswap.</li><li>Coba protokol lending dan borrowing yang tersedia.</li></ol>" 
  },
  { 
    id: 4, 
    slug: "scroll-origins-nft-drop",
    title: "Scroll Origins NFT Drop", 
    description: "Airdrop NFT untuk para deployer awal di jaringan Scroll. Event ini sudah berakhir.", 
    link: "https://scroll.io/", 
    category: "NFT Drop", 
    status: "ended", 
    image_url: "https://pbs.twimg.com/profile_images/1696531399317917696/2T3p4N__400x400.jpg", 
    date: "Q2 2025", 
    tutorial: "<p>Event ini telah berakhir. Pemenang sudah ditentukan berdasarkan snapshot deployer kontrak sebelum tanggal yang ditentukan.</p>" 
  }
];

// Fungsi untuk mendapatkan semua data airdrop
export const getAllAirdrops = () => {
    return airdrops;
}

// Fungsi untuk menemukan satu airdrop berdasarkan slug-nya
export const getAirdropBySlug = (slug) => {
    return airdrops.find(airdrop => airdrop.slug === slug);
}
