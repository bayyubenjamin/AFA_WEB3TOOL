// src/components/WalletInfo.jsx
import React from 'react';
import { useBalance, useAccount } from 'wagmi';
import { base } from 'wagmi/chains';
import { Box, Text, Button, VStack, HStack, Heading, Tag, useClipboard, useToast, Spinner } from '@chakra-ui/react';

export function WalletInfo({ onDisconnect }) {
  const { address } = useAccount();
  const { data, isError, isLoading } = useBalance({ address, chainId: base.id });
  const { onCopy } = useClipboard(address || '');
  const toast = useToast();

  const handleCopy = () => {
    onCopy();
    toast({ title: "Alamat disalin!", status: "success", duration: 2000 });
  };

  if (!address) return <Text>Menghubungkan ke dompet...</Text>

  return (
    <Box p={5} borderWidth={1} borderRadius="lg">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Dompet Anda Aktif</Heading>
        <Box>
          <Text fontSize="sm" color="gray.500">Alamat Dompet:</Text>
          <HStack>
            <Tag size="lg" variant="solid" colorScheme="teal" maxW="250px" isTruncated>{address}</Tag>
            <Button size="sm" onClick={handleCopy}>Salin</Button>
          </HStack>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.500">Saldo (Base Mainnet):</Text>
          {isLoading && <Spinner size="sm" />}
          {data && <Text fontSize="2xl" fontWeight="bold">{parseFloat(data.formatted).toFixed(5)} {data.symbol}</Text>}
          {isError && <Text color="red.500">Gagal memuat saldo</Text>}
        </Box>
        <HStack spacing={4}>
          <Button colorScheme="green" w="full">Deposit</Button>
          <Button colorScheme="orange" w="full">Withdraw</Button>
        </HStack>
        <Button variant="link" colorScheme="red" onClick={onDisconnect} mt={4}>Putuskan Koneksi Dompet</Button>
      </VStack>
    </Box>
  );
}
