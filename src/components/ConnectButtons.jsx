// src/components/ConnectButtons.jsx
import React from 'react';
import { useConnect } from 'wagmi';
import { Button, VStack } from '@chakra-ui/react';

export function ConnectButtons() {
  const { connectors, connect } = useConnect();

  const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');

  return (
    <VStack spacing={4} w="100%">
      {coinbaseConnector && (
        <Button
          onClick={() => connect({ connector: coinbaseConnector })}
          colorScheme="blue"
          w="100%"
        >
          Login atau Daftar dengan Email (Web3)
        </Button>
      )}
    </VStack>
  );
}
