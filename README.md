# AFA WEB3TOOL - An Integrated Web3 Platform

![AFA Identity NFT](https://ik.imagekit.io/5spt6gb2z/Gambar%20GIF.gif)

AFA WEB3TOOL is a multi-functional Web3 platform designed to be the main gateway to the AFA ecosystem. This project integrates an on-chain identity through soul-bound NFTs, a portal for airdrops and events, and a flexible authentication system, all within a single modern and responsive application.

## ✨ Key Features

-   **AFA Identity**: An on-chain identity system where users can mint a unique *soul-bound* NFT (SBT) as proof of their identity within the ecosystem. This non-transferable NFT is the key to various features.
-   **Membership Tiers**: Users can upgrade their AFA Identity NFT to a Premium tier to unlock exclusive benefits and early access to new features.
-   **Flexible Authentication**: Supports multiple login methods, including **Email/Password**, **Wallet Connect (Web3)**, and **Telegram Login**, providing easy access for all types of users.
-   **Airdrop & Event Portal**: A centralized platform to discover, join, and manage participation in various airdrops and community events.
-   **Unified User Profile**: A profile page where users can link their wallet address, connect their Telegram account, and secure their account with an email.
-   **Admin Panel**: A dedicated dashboard for admins to efficiently manage platform content like airdrops and events.
-   **Multi-language Support**: The interface supports both English and Indonesian.
-   **Light & Dark Mode**: A customizable theme for user's visual comfort.
-   **Mobile-Ready**: Built with Capacitor, allowing the application to be ported into a native Android app in the future.

## 🛠️ Tech Stack

-   **Frontend**:
    -   [**React**](https://reactjs.org/) (via [Vite](https://vitejs.dev/))
    -   [**Tailwind CSS**](https://tailwindcss.com/)
    -   [**Wagmi**](https://wagmi.sh/): React Hooks for blockchain interaction.
    -   [**Ethers.js**](https://ethers.io/): A library for interacting with Ethereum wallets.
-   **Backend & Authentication**:
    -   [**Supabase**](https://supabase.io/): Used for the database, authentication, and serverless Edge Functions.
-   **Smart Contracts**:
    -   [**Solidity**](https://soliditylang.org/): For the AFA Identity NFT.
    -   **Standard**: ERC-721 (Soul-Bound Token).
    -   **Network (Test)**: OP Sepolia.
-   **Deployment**:
    -   [**Vercel**](https://vercel.com/)
-   **Mobile**:
    -   [**Capacitor**](https://capacitorjs.com/)

## 🚀 Getting Started Locally

Follow these steps to run the project in your local development environment.

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or higher)
-   [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
-   A [Supabase](https://supabase.com/) account for the backend.

## 🏗️ Project Structure

```
/
├── android/              # Capacitor config for Android
├── supabase/
│   └── functions/        # Code for Supabase Edge Functions (login, verification, etc.)
├── src/
│   ├── components/       # React components (Pages, Header, Forms, etc.)
│   ├── context/          # React Context (Theme, Language)
│   ├── contracts/        # Smart Contract ABIs
│   ├── hooks/            # Custom hooks
│   ├── styles/           # Global CSS files
│   ├── supabaseClient.js # Supabase client configuration
│   ├── wagmiConfig.js    # Wagmi configuration
│   └── main.jsx          # Application entry point
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.js        # Vite configuration
└── package.json          # Project dependencies and scripts
```

## 🔗 Smart Contract & Backend

### Smart Contract

-   **AFA Identity**: The main contract for the soul-bound NFT.
-   **Contract Address (OP Sepolia)**: `0x8611E3C3F991C989fEF0427998062f77c9D0A2F1`
-   **ABI**: Available at `src/contracts/AFAIdentityDiamondABI.json`.

### Supabase Backend

The project heavily relies on Supabase for its backend functionality:
-   **Auth**: Manages all login methods (email, wallet, Telegram).
-   **Database**: Stores user data, profiles, and platform-related information.
--   **Edge Functions**: Executes secure server-side logic, such as:
    -   Verifying Telegram logins & wallet ownership.
    -   Linking email/password to existing accounts.
    -   Processing Telegram bot logic.

## 🤝 Contributing

Contributions from the community are highly appreciated! If you'd like to contribute, please fork the repository, create a new branch for your feature or fix, and submit a Pull Request.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

