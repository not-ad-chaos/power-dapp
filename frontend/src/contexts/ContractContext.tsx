'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import contractsData from '../contracts/contracts.json';

interface ContractContextType {
  account: string;
  energyLogger: ethers.Contract | null;
  renewableCertificate: ethers.Contract | null;
  energyTrader: ethers.Contract | null;
  provider: ethers.providers.Web3Provider | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
}

const ContractContext = createContext<ContractContextType>({
  account: '',
  energyLogger: null,
  renewableCertificate: null,
  energyTrader: null,
  provider: null,
  connectWallet: async () => {},
  isConnected: false,
});

export const useContract = () => useContext(ContractContext);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string>('');
  const [energyLogger, setEnergyLogger] = useState<ethers.Contract | null>(null);
  const [renewableCertificate, setRenewableCertificate] = useState<ethers.Contract | null>(null);
  const [energyTrader, setEnergyTrader] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const signer = web3Provider.getSigner();
        const userAddress = await signer.getAddress();
        
        // Get network ID to use the correct contract addresses
        const network = await web3Provider.getNetwork();
        const networkId = network.chainId.toString();
        
        // If contracts are not deployed to this network, use the default network
        const addresses = contractsData.addresses;
        const abis = contractsData.abi;
        
        if (!addresses || !abis) {
          throw new Error('Contract data not found. Please ensure contracts are deployed and exported correctly.');
        }
        
        const loggerContract = new ethers.Contract(
          addresses.ENERGY_LOGGER,
          abis.ENERGY_LOGGER,
          signer
        );
        
        const certificateContract = new ethers.Contract(
          addresses.RENEWABLE_CERTIFICATE,
          abis.RENEWABLE_CERTIFICATE,
          signer
        );
        
        const traderContract = new ethers.Contract(
          addresses.ENERGY_TRADER,
          abis.ENERGY_TRADER,
          signer
        );
        
        setAccount(userAddress);
        setEnergyLogger(loggerContract);
        setRenewableCertificate(certificateContract);
        setEnergyTrader(traderContract);
        setProvider(web3Provider);
        setIsConnected(true);
      } else {
        alert('MetaMask is not installed. Please install it to use this dApp.');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      alert('Error connecting to wallet. Please make sure contracts are deployed to your current network.');
    }
  };
  
  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
          setIsConnected(false);
        }
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  return (
    <ContractContext.Provider
      value={{
        account,
        energyLogger,
        renewableCertificate,
        energyTrader,
        provider,
        connectWallet,
        isConnected,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}; 