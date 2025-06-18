// src/components/WalletConnectModal.jsx
import React from 'react';
import { useConnect } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// URL Ikon untuk setiap wallet
const walletIcons = {
  // Gunakan URL ikon resmi atau yang berkualitas tinggi
  'metaMask': 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  'walletConnect': 'https://wallectconnect.com/favicon.ico',
  'coinbaseWallet': 'https://www.vectorlogo.zone/logos/coinbase/coinbase-icon.svg',
  'okxWallet': 'https://static.okx.com/cdn/assets/imgs/226/5B2529DECB27C8A9.png',
  // Tambahkan ikon lain sesuai kebutuhan
};

// Nama tampilan untuk setiap konektor
const getConnectorName = (name) => {
  if (name.toLowerCase().includes('coinbase')) return 'Coinbase Wallet';
  return name;
}

const WalletButton = ({ connector, onClose }) => {
  const { connect } = useConnect();
  const [isReady, setIsReady] = React.useState(false);
  const iconUrl = walletIcons[connector.id] || `https://ui-avatars.com/api/?name=${connector.name.charAt(0)}&background=2a2a3a&color=fff&rounded=true`;

  React.useEffect(() => {
    connector.getProvider().then((provider) => {
      if (provider) {
        setIsReady(true);
      }
    });
  }, [connector]);

  return (
    <button
      className="wallet-connect-button"
      disabled={!isReady}
      onClick={() => {
        connect({ connector });
        onClose(); // Langsung tutup modal setelah klik
      }}
    >
      <div className="flex items-center gap-4">
        <img src={iconUrl} alt={connector.name} className="w-8 h-8 rounded-full" />
        <span className="font-semibold">{getConnectorName(connector.name)}</span>
      </div>
      {isReady ? 
        <span className="wallet-status-tag installed">INSTALLED</span> : 
        (connector.id === 'walletConnect' && <span className="wallet-status-tag qr">QR CODE</span>)
      }
    </button>
  );
};

export default function WalletConnectModal({ isOpen, onClose }) {
  const { connectors } = useConnect();

  if (!isOpen) return null;

  // Urutkan konektor: yang terinstall duluan
  const sortedConnectors = [...connectors].sort((a) => (a.id === 'injected' ? -1 : 1));

  return (
    <div className="modal active" onClick={onClose}>
      <div className="wallet-connect-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-connect-header">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button onClick={onClose} className="modal-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="wallet-connect-body">
          {sortedConnectors.map((connector) => (
            <WalletButton key={connector.uid} connector={connector} onClose={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
}
