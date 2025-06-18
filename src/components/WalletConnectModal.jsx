// src/components/WalletConnectModal.jsx
import React from 'react';
import { useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const walletIcons = {
  'MetaMask': 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  'WalletConnect': 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
  'Coinbase Wallet': 'https://www.vectorlogo.zone/logos/coinbase/coinbase-icon.svg',
  'OKX Wallet': 'https://static.okx.com/cdn/assets/imgs/226/5B2529DECB27C8A9.png',
  'Brave Wallet': 'https://brave.com/static-assets/images/brave-logo-sans-text.svg',
  'default': 'https://www.svgrepo.com/show/448252/wallet.svg'
};

const getConnectorName = (connector) => {
  const name = connector.name;
  if (connector.rdns === 'io.metamask') return 'MetaMask';
  if (connector.rdns === 'com.coinbase.wallet') return 'Coinbase Wallet';
  if (connector.rdns === 'com.okex.wallet') return 'OKX Wallet';
  if (connector.name.toLowerCase().includes('coinbase')) return 'Coinbase Wallet';
  if (name === 'MetaMask') return 'MetaMask';
  if (name === 'WalletConnect') return 'WalletConnect';
  if (name === 'Brave Wallet') return 'Brave Wallet';
  // Fallback untuk dompet injected lain yang mungkin tidak memiliki rdns
  if (name === 'Injected') return 'Brave Wallet';
  return name;
};

const WalletButton = ({ connector, onClose }) => {
  const { connect, isPending, variables } = useConnect();
  const { open } = useWeb3Modal();
  const [isReady, setIsReady] = React.useState(false);
  
  const displayName = getConnectorName(connector);
  const isLoading = isPending && variables?.connector?.id === connector.id;
  const iconUrl = walletIcons[displayName] || walletIcons.default;
  
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

  const handleConnect = () => {
    if (connector.id === 'walletConnect') {
      onClose();
      open();
    } else {
      connect(
        { connector },
        {
          onSuccess: () => onClose(),
        }
      );
    }
  }

  return (
    <button
      className="wallet-connect-button group"
      disabled={!isReady && connector.id !== 'walletConnect'}
      onClick={handleConnect}
    >
      <div className="flex items-center gap-4">
        <div className="wallet-icon-wrapper">
          <img src={iconUrl} alt={displayName} className="w-8 h-8" />
        </div>
        <span className="text-base font-bold text-light-text dark:text-gray-100">{displayName}</span>
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

  // [PERBAIKAN] Logika untuk menyaring duplikat berdasarkan nama
  const uniqueConnectors = [];
  const seenNames = new Set();
  
  connectors.forEach(connector => {
    const name = getConnectorName(connector);
    if (!seenNames.has(name)) {
      seenNames.add(name);
      uniqueConnectors.push(connector);
    }
  });

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
          <div className="flex flex-col gap-2">
            {/* [MODIFIKASI] Gunakan array yang sudah disaring */}
            {uniqueConnectors.map((connector) => (
              <WalletButton key={connector.uid} connector={connector} onClose={onClose} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
