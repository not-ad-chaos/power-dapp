'use client';

import { useContract } from '../contexts/ContractContext';

export default function Navbar() {
  const { account, connectWallet, isConnected } = useContract();
  
  return (
    <nav className="bg-green-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">Energy Blockchain App</div>
        
        <div className="flex items-center">
          {isConnected ? (
            <div className="flex items-center">
              <div className="mr-4 px-2 py-1 bg-green-700 rounded-md">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
              <div className="h-3 w-3 bg-green-300 rounded-full animate-pulse"></div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="bg-white text-green-600 hover:bg-green-100 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 