# AFA WEB3TOOL - Integrated Web3 Dashboard

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v18.3.1-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/build-vite-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/backend-supabase-3ECF8E?logo=supabase)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange?logo=pwa)
![Celo](https://img.shields.io/badge/Network-Celo_Mainnet-35D07F?logo=celo)
![MiniPay](https://img.shields.io/badge/Wallet-MiniPay_Ready-green)

![Tool by Airdrop For All](https://ik.imagekit.io/5spt6gb2z/Cuplikan%20layar%20dari%202025-06-29%2022-41-56.png)

> **The main gateway to the AFA ecosystem.** An all-in-one Web3 platform designed for airdrop hunters and community members.

[🌐 **Live Demo**](https://airdropforall.app) | [🐛 **Report Bug**](https://github.com/bayyubenjamin/afa_web3tool/issues)

---

## ✨ Key Features

### 💎 Core Ecosystem
-   **AFA Identity (SBT)**: On-chain identity system using Soul-Bound Tokens (ERC-721) on OP Sepolia.
-   **Membership Tiers**: Upgradeable NFT mechanics to unlock premium dashboard features.
-   **Wallet Connect**: Integrated with **Wagmi & Web3Modal** for seamless multi-wallet support.
-   **Celo & MiniPay Integration**: Native support for Celo Mainnet with a custom hook for seamless, buttonless auto-connect tailored specifically for Opera MiniPay users.
-   **Multi-Chain & Bitcoin L2 Ready**: Configured for Base network and integrated with Stacks/Hiro for Bitcoin L2 interaction.

### 📱 User Experience (New)
-   **Progressive Web App (PWA)**: Installable on Android & iOS. Looks and feels like a native app.
-   **Native Android App**: Built and wrapped via **Capacitor** allowing for direct Android installation and Play Store deployment.
-   **Offline Support**: Automatic network detection with smart notifications when connection is lost/restored.
-   **Multi-language**: Native support for **English** and **Indonesian**.
-   **Themes**: Customizable Dark/Light mode for visual comfort.

### 🛡️ Security & Auth
-   **Flexible Login**: Support for **Email/Password**, **Web3 Wallet**, and **Telegram Auth**.
-   **Account Linking**: Unified profile connecting Web2 (Email/Telegram) and Web3 (Wallet) identities.
-   **Zero-Knowledge Proofs**: Configured with Vlayer SDK for advanced data privacy and verification.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: [React](https://reactjs.org/) (Vite)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + FontAwesome
-   **Mobile Wrapper**: [Capacitor](https://capacitorjs.com/) (`@capacitor/android`)
-   **PWA**: Web Manifest & Service Workers

### Web3 Technologies
-   **Core**: [Wagmi](https://wagmi.sh/) + [Viem](https://viem.sh/) + [Ethers.js](https://ethers.io/)
-   **UI & Connectors**: Web3Modal, Injected Providers (MiniPay specific hooks)
-   **Bitcoin L2**: Stacks Connect React (`@stacks/connect-react`)
-   **ZK Framework**: Vlayer React & SDK

### Backend & Infrastructure
-   **Core**: [Supabase](https://supabase.io/) (Auth, Database, Realtime)
-   **Compute**: Supabase Edge Functions (Deno)
-   **Hosting**: [Vercel](https://vercel.com/)

### Smart Contracts
-   **Networks**: Optimism Sepolia, Celo Mainnet, Base
-   **Standard**: ERC-721 (Soul-Bound), Custom Diamond Standard implementation
-   **Language**: Solidity

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/bayyubenjamin/afa_web3tool.git](https://github.com/bayyubenjamin/afa_web3tool.git)
    cd afa_web3tool
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Setup Environment Variables**
    Create a `.env` file based on your Supabase and WalletConnect credentials.

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🏗️ Project Structure

```bash
/
├── android/              # Native Android wrapper (Capacitor)
├── supabase/             # Edge Functions & Database types
├── public/               # Static assets & Manifest
├── src/
│   ├── components/       # UI Components (Header, Auth, Modals, Pages)
│   ├── contracts/        # ABI & Contract Addresses (AFA Identity, Celo)
│   ├── hooks/            # Custom React Hooks (useMiniPay, useBaseNetwork)
│   ├── services/         # API & Supabase logic
│   └── wagmiConfig.js    # Web3 Configuration (Chains, Transports, Web3Modal)
└── vercel.json           # Deployment Headers & Rules

---

## 🏗️ Stacks Ecosystem Integration
This project is actively participating in the **Stacks Builder Rewards** program. 
- **Smart Contracts:** Contains Clarity smart contracts (`.clar`) to interact with the Stacks blockchain.
- **Web3 Integration:** Utilizing `@stacks/network` and `@stacks/connect` for seamless blockchain interactions and Bitcoin scalability.
- **Wallet Support:** Ready to integrate with Stacks-compatible wallets like Leather and Xverse.
