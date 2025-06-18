// src/components/WalletConnectModal.jsx
import React from 'react';
import { useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react'; // <-- [DITAMBAHKAN]
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faEnvelope } from '@fortawesome/free-solid-svg-icons';

// URL Ikon resolusi tinggi untuk setiap wallet
const walletIcons = {
  'metaMask': 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  'walletConnect': 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
  'coinbaseWallet': 'https://www.vectorlogo.zone/logos/coinbase/coinbase-icon.svg',
  'default': 'https://www.svgrepo.com/show/448252/wallet.svg'
};

// Nama tampilan yang lebih rapi untuk setiap konektor
const getConnectorName = (name) => {
  if (name.toLowerCase().includes('coinbase')) return 'Coinbase Wallet';
  if (name.toLowerCase().includes('metamask')) return 'MetaMask';
  if (name.toLowerCase().includes('walletconnect')) return 'WalletConnect';
  if (name.toLowerCase().includes('okx')) return 'OKX Wallet';
  return name;
}

const WalletButton = ({ connector }) => {
  const { connect, isPending, variables } = useConnect();
  const { open } = useWeb3Modal(); // <-- [DITAMBAHKAN]
  const [isReady, setIsReady] = React.useState(false);
  const isLoading = isPending && variables?.connector?.id === connector.id;

  const iconUrl = walletIcons[connector.id] || walletIcons['default'];
  
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      const provider = await connector.getProvider();
      if (isMounted) {
        setIsReady(!!provider);
      }
    })();
    return () => { isMounted = false; };
  }, [connector]);

  // [DIPERBARUI] Logika klik tombol
  const handleConnect = () => {
    if (connector.id === 'walletConnect') {
      open(); // Buka Web3Modal untuk WalletConnect
    } else {
      connect({ connector }); // Hubungkan langsung untuk yang lain
    }
  }

  return (
    <button
      className="wallet-connect-button group"
      // WalletConnect selalu bisa diklik untuk memunculkan QR Code
      disabled={!isReady && connector.id !== 'walletConnect'}
      onClick={handleConnect}
    >
      <div className="flex items-center gap-4">
        <div className="wallet-icon-wrapper">
          <img src={iconUrl} alt={connector.name} className="w-8 h-8" />
        </div>
        <span className="text-base font-bold text-light-text dark:text-gray-100">{getConnectorName(connector.name)}</span>
      </div>
      
      {isLoading ? (
        <div className="w-20 flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        isReady ? 
          <span className="wallet-status-tag installed">INSTALLED</span> :
          (connector.id === 'walletConnect' && <span className="wallet-status-tag qr">QR CODE</span>)
      )}
    </button>
  );
};

export default function WalletConnectModal({ isOpen, onClose }) {
  const { connectors } = useConnect();

  if (!isOpen) return null;

  return (
    <div className="modal active" onMouseDown={onClose}>
      <div className="wallet-connect-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="wallet-connect-header">
          <h2 className="text-xl font-bold text-light-text dark:text-white">Connect Wallet</h2>
          <button onClick={onClose} className="modal-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="wallet-connect-body">
          <div className="form-group relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="Email" className="w-full pl-10" disabled/>
          </div>
          <div className="separator-or">or</div>
          <div className="flex flex-col gap-2">
            {connectors.map((connector) => (
              <WalletButton key={connector.uid} connector={connector} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
