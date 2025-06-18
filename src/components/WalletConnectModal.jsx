// src/components/WalletConnectModal.jsx
import React from 'react';
import { useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

// Daftar ikon wallet yang sudah diperbaiki
const walletIcons = {
  'MetaMask': 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  'WalletConnect': 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
  'OKX Wallet': 'https://developers.moralis.com/wp-content/uploads/web3wiki/47-okx-wallet/645c177c66d302f70d9a863e_OKX-Wallet-Twitter-Logo-300x300.jpeg',
  'Coinbase Wallet': 'https://raw.githubusercontent.com/gist/taycaldwell/2291907115c0bb5589bc346661435007/raw/280eafdc84cb80ed0c60e36b4d0c563f6dca6b3e/cbw.svg',
  'Brave Wallet': 'https://brave.com/static-assets/images/brave-logo-sans-text.svg',
  'default': 'https://www.svgrepo.com/show/448252/wallet.svg'
};

const getConnectorName = (connector) => {
  const name = connector.name;
  if (name.toLowerCase().includes('coinbase')) return 'Coinbase Wallet';
  if (name.toLowerCase().includes('metamask')) return 'MetaMask';
  if (name.toLowerCase().includes('walletconnect')) return 'WalletConnect';
  if (connector.rdns === 'io.metamask') return 'MetaMask';
  if (connector.rdns === 'com.okex.wallet') return 'OKX Wallet';
  if (connector.rdns === 'com.coinbase.wallet') return 'Coinbase Wallet';
  return name;
}

const WalletButton = ({ connector, onClose }) => {
  const { connect, isPending, variables } = useConnect();
  const { open } = useWeb3Modal();
  const [isReady, setIsReady] = React.useState(false);
  
  const displayName = getConnectorName(connector);
  const isLoading = isPending && variables?.connector?.id === connector.id;
  const iconUrl = walletIcons[displayName] || walletIcons['default'];
  
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
          onSuccess: () => {
            onClose();
          }
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

  return (
    <div className="modal active" onMouseDown={onClose}>
      <div className="wallet-connect-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="wallet-connect-header">
          <h2 className="text-xl font-bold text-light-text dark:text-white">Connect Wallet</h2>
          <button onClick={onClose} className="modal-close-btn">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        {/* [DIPERBARUI] Bagian email dan separator 'or' telah dihapus */}
        <div className="wallet-connect-body">
          <div className="flex flex-col gap-2">
            {connectors.map((connector) => (
              <WalletButton key={connector.uid} connector={connector} onClose={onClose} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
