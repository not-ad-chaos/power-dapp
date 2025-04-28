'use client';

import { useState, useEffect } from 'react';
import { useContract } from '../contexts/ContractContext';

export default function RenewableCertificateCard() {
  const { renewableCertificate, account, isConnected } = useContract();
  const [energyAmount, setEnergyAmount] = useState<string>('');
  const [generatorAddress, setGeneratorAddress] = useState<string>('');
  const [certificateCount, setCertificateCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get certificate count for the connected account
  useEffect(() => {
    const fetchCertificates = async () => {
      if (renewableCertificate && account) {
        try {
          const count = await renewableCertificate.getCertificates(account);
          setCertificateCount(parseInt(count.toString()));
        } catch (error) {
          console.error('Error fetching certificates:', error);
        }
      }
    };

    if (isConnected) {
      fetchCertificates();
    }
  }, [renewableCertificate, account, isConnected]);

  const handleMintCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewableCertificate || !energyAmount || !generatorAddress) return;
    
    setIsLoading(true);
    try {
      const tx = await renewableCertificate.mintCertificate(
        generatorAddress, 
        parseInt(energyAmount)
      );
      await tx.wait();
      
      setEnergyAmount('');
      
      // If minting for self, update the count
      if (generatorAddress.toLowerCase() === account.toLowerCase()) {
        const count = await renewableCertificate.getCertificates(account);
        setCertificateCount(parseInt(count.toString()));
      }
    } catch (error) {
      console.error('Error minting certificate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Renewable Certificates</h2>
      
      {isConnected ? (
        <>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Your Certificates</h3>
            <div className="text-3xl font-bold text-blue-600">{certificateCount}</div>
            <div className="text-sm text-gray-500 mt-1">Each certificate represents 100 kWh of renewable energy</div>
          </div>
          
          <form onSubmit={handleMintCertificate}>
            <div className="mb-4">
              <label htmlFor="generator-address" className="block text-gray-700 mb-2">
                Generator Address
              </label>
              <input
                id="generator-address"
                type="text"
                value={generatorAddress}
                onChange={(e) => setGeneratorAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="energy-produced" className="block text-gray-700 mb-2">
                Energy Produced (kWh)
              </label>
              <input
                id="energy-produced"
                type="number"
                value={energyAmount}
                onChange={(e) => setEnergyAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount in kWh"
                required
                min="1"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Minting...' : 'Mint Certificate'}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Connect your wallet to view and mint certificates</p>
        </div>
      )}
    </div>
  );
} 